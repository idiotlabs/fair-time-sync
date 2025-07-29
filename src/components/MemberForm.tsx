import React, { useState, useEffect } from 'react';
import { logEvent } from '@/lib/event-logger';
import { getToastMessage } from '@/lib/toast-messages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Trash2, Clock, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// IANA timezone list
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland'
];

const DAYS_OF_WEEK = [
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
  { value: 0, label: '일요일' }
];

const memberFormSchema = z.object({
  display_name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  timezone: z.string().min(1, '시간대를 선택해주세요'),
  working_blocks: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_minute: z.number().min(0).max(1439),
    end_minute: z.number().min(0).max(1439)
  })).min(1, '최소 1개의 근무 시간을 설정해주세요'),
  no_meeting_blocks: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_minute: z.number().min(0).max(1439),
    end_minute: z.number().min(0).max(1439)
  })).optional()
}).refine((data) => {
  // Check working blocks for overlaps and start < end
  for (const block of data.working_blocks) {
    if (block.start_minute >= block.end_minute) {
      return false;
    }
  }
  return true;
}, { message: '근무 시간의 시작 시간은 종료 시간보다 빨라야 합니다' });

type MemberFormData = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  member?: any;
  onSuccess: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ 
  open, 
  onOpenChange, 
  teamId, 
  member, 
  onSuccess 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      display_name: '',
      email: '',
      timezone: 'UTC',
      working_blocks: [
        { day_of_week: 1, start_minute: 540, end_minute: 1020 } // 9 AM - 5 PM Monday
      ],
      no_meeting_blocks: []
    }
  });

  const { fields: workingFields, append: appendWorking, remove: removeWorking } = useFieldArray({
    control: form.control,
    name: 'working_blocks'
  });

  const { fields: noMeetingFields, append: appendNoMeeting, remove: removeNoMeeting } = useFieldArray({
    control: form.control,
    name: 'no_meeting_blocks'
  });

  useEffect(() => {
    if (member) {
      form.reset({
        display_name: member.display_name || '',
        email: member.email || '',
        timezone: member.timezone || 'UTC',
        working_blocks: member.working_blocks || [
          { day_of_week: 1, start_minute: 540, end_minute: 1020 }
        ],
        no_meeting_blocks: member.no_meeting_blocks || []
      });
    } else {
      form.reset({
        display_name: '',
        email: '',
        timezone: 'UTC',
        working_blocks: [
          { day_of_week: 1, start_minute: 540, end_minute: 1020 }
        ],
        no_meeting_blocks: []
      });
    }
  }, [member, form]);

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseTimeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const filteredTimezones = TIMEZONES.filter(tz => 
    tz.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      if (member) {
        // Update existing member
        const { error: memberError } = await supabase
          .from('team_members')
          .update({
            display_name: data.display_name,
            email: data.email || null,
            timezone: data.timezone
          })
          .eq('id', member.id);

        if (memberError) throw memberError;

        // Delete existing blocks
        await supabase.from('working_blocks').delete().eq('member_id', member.id);
        await supabase.from('no_meeting_blocks').delete().eq('member_id', member.id);
      } else {
        // Create new member
        const { data: newMember, error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            display_name: data.display_name,
            email: data.email || null,
            timezone: data.timezone,
            role: 'member'
          })
          .select()
          .single();

        if (memberError) throw memberError;
        member = newMember;
      }

      // Insert working blocks
      if (data.working_blocks.length > 0) {
        const { error: workingError } = await supabase
          .from('working_blocks')
          .insert(
            data.working_blocks.map(block => ({
              member_id: member.id,
              day_of_week: block.day_of_week,
              start_minute: block.start_minute,
              end_minute: block.end_minute
            }))
          );

        if (workingError) throw workingError;
      }

      // Insert no meeting blocks
      if (data.no_meeting_blocks && data.no_meeting_blocks.length > 0) {
        const { error: noMeetingError } = await supabase
          .from('no_meeting_blocks')
          .insert(
            data.no_meeting_blocks.map(block => ({
              member_id: member.id,
              day_of_week: block.day_of_week,
              start_minute: block.start_minute,
              end_minute: block.end_minute
            }))
          );

        if (noMeetingError) throw noMeetingError;
      }

      // Log event
      await logEvent({
        eventType: 'member_added',
        teamId,
        metadata: { 
          member_id: member.id,
          member_name: data.display_name,
          action: member ? 'updated' : 'created'
        }
      });

      toast({
        title: member ? "멤버 수정 완료" : "멤버 추가 완료",
        description: getToastMessage(
          member ? 'member_updated_success' : 'member_added_success', 
          'ko'
        ),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: getToastMessage(
          member ? 'member_updated_error' : 'member_added_error', 
          'ko'
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? '멤버 수정' : '멤버 추가'}</DialogTitle>
          <DialogDescription>
            팀 멤버의 정보와 근무 시간을 설정하세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="이름을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="이메일을 입력하세요 (선택)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시간대 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="시간대를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <Input 
                          placeholder="시간대 검색..."
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                        />
                      </div>
                      {filteredTimezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Working Blocks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">근무 시간</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendWorking({ day_of_week: 1, start_minute: 540, end_minute: 1020 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workingFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                    <Controller
                      control={form.control}
                      name={`working_blocks.${index}.day_of_week`}
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="요일" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    
                    <Controller
                      control={form.control}
                      name={`working_blocks.${index}.start_minute`}
                      render={({ field }) => (
                        <Input
                          type="time"
                          className="w-32"
                          value={formatMinutesToTime(field.value || 0)}
                          onChange={(e) => field.onChange(parseTimeToMinutes(e.target.value))}
                        />
                      )}
                    />
                    
                    <span className="text-muted-foreground">~</span>
                    
                    <Controller
                      control={form.control}
                      name={`working_blocks.${index}.end_minute`}
                      render={({ field }) => (
                        <Input
                          type="time"
                          className="w-32"
                          value={formatMinutesToTime(field.value || 0)}
                          onChange={(e) => field.onChange(parseTimeToMinutes(e.target.value))}
                        />
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorking(index)}
                      disabled={workingFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* No Meeting Blocks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">회의 금지 시간</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendNoMeeting({ day_of_week: 1, start_minute: 720, end_minute: 780 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {noMeetingFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    회의 금지 시간이 설정되지 않았습니다.
                  </p>
                ) : (
                  noMeetingFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                      <Controller
                        control={form.control}
                        name={`no_meeting_blocks.${index}.day_of_week`}
                        render={({ field }) => (
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="요일" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      
                      <Controller
                        control={form.control}
                        name={`no_meeting_blocks.${index}.start_minute`}
                        render={({ field }) => (
                          <Input
                            type="time"
                            className="w-32"
                            value={formatMinutesToTime(field.value || 0)}
                            onChange={(e) => field.onChange(parseTimeToMinutes(e.target.value))}
                          />
                        )}
                      />
                      
                      <span className="text-muted-foreground">~</span>
                      
                      <Controller
                        control={form.control}
                        name={`no_meeting_blocks.${index}.end_minute`}
                        render={({ field }) => (
                          <Input
                            type="time"
                            className="w-32"
                            value={formatMinutesToTime(field.value || 0)}
                            onChange={(e) => field.onChange(parseTimeToMinutes(e.target.value))}
                          />
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNoMeeting(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={loading} className="btn-gradient">
                {loading ? '저장 중...' : (member ? '수정' : '추가')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberForm;