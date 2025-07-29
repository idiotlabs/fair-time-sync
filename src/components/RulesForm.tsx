import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Settings, Save } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const rulesFormSchema = z.object({
  duration_minutes: z.number().min(15).max(180),
  cadence: z.enum(['weekly', 'biweekly']),
  min_attendance_ratio: z.number().min(0.5).max(1.0),
  night_cap_per_week: z.number().min(0).max(10),
  prohibited_days: z.array(z.number().min(0).max(6)),
  required_member_ids: z.array(z.string()),
  rotation_enabled: z.boolean()
});

type RulesFormData = z.infer<typeof rulesFormSchema>;

interface RulesFormProps {
  teamId: string;
  members: any[];
  onSuccess: () => void;
}

const DURATION_OPTIONS = [
  { value: 25, label: '25분' },
  { value: 45, label: '45분' },
  { value: 60, label: '60분' },
  { value: 90, label: '90분' },
  { value: 120, label: '120분' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: '일요일' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' }
];

const RulesForm: React.FC<RulesFormProps> = ({ teamId, members, onSuccess }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingRules, setExistingRules] = useState<any>(null);

  const form = useForm<RulesFormData>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: {
      duration_minutes: 60,
      cadence: 'weekly',
      min_attendance_ratio: 0.6,
      night_cap_per_week: 1,
      prohibited_days: [0, 6], // Sunday and Saturday
      required_member_ids: [],
      rotation_enabled: true
    }
  });

  useEffect(() => {
    fetchExistingRules();
  }, [teamId]);

  const fetchExistingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setExistingRules(data);
        form.reset({
          duration_minutes: data.duration_minutes,
          cadence: data.cadence,
          min_attendance_ratio: data.min_attendance_ratio,
          night_cap_per_week: data.night_cap_per_week,
          prohibited_days: data.prohibited_days || [],
          required_member_ids: data.required_member_ids || [],
          rotation_enabled: data.rotation_enabled
        });
      }
    } catch (error: any) {
      console.error('Error fetching rules:', error);
    }
  };

  const onSubmit = async (data: RulesFormData) => {
    setLoading(true);
    try {
      const rulesData = {
        team_id: teamId,
        duration_minutes: data.duration_minutes,
        cadence: data.cadence,
        min_attendance_ratio: data.min_attendance_ratio,
        night_cap_per_week: data.night_cap_per_week,
        prohibited_days: data.prohibited_days,
        required_member_ids: data.required_member_ids,
        rotation_enabled: data.rotation_enabled
      };

      if (existingRules) {
        // Update existing rules
        const { error } = await supabase
          .from('rules')
          .update(rulesData)
          .eq('id', existingRules.id);

        if (error) throw error;
      } else {
        // Create new rules
        const { error } = await supabase
          .from('rules')
          .insert(rulesData);

        if (error) throw error;
      }

      toast({
        title: "규칙 저장 완료",
        description: "회의 규칙이 성공적으로 저장되었습니다.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>회의 규칙 설정</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Duration */}
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>회의 시간</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="회의 시간을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cadence */}
            <FormField
              control={form.control}
              name="cadence"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>회의 주기</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">매주</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="biweekly" id="biweekly" />
                        <Label htmlFor="biweekly">격주</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Min Attendance Ratio */}
            <FormField
              control={form.control}
              name="min_attendance_ratio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최소 참석률: {Math.round(field.value * 100)}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0.5}
                      max={1.0}
                      step={0.05}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    회의 제안을 위한 최소 팀원 참석률을 설정하세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Night Cap Per Week */}
            <FormField
              control={form.control}
              name="night_cap_per_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주당 야간 회의 횟수</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    한 주에 허용되는 야간 회의 최대 횟수를 설정하세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prohibited Days */}
            <FormField
              control={form.control}
              name="prohibited_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>회의 금지 요일</FormLabel>
                  <FormDescription>
                    회의를 금지할 요일을 선택하세요.
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, day.value]);
                            } else {
                              field.onChange(field.value.filter(d => d !== day.value));
                            }
                          }}
                        />
                        <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required Members */}
            <FormField
              control={form.control}
              name="required_member_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>필수 참석자</FormLabel>
                  <FormDescription>
                    모든 회의에 반드시 참석해야 하는 팀원을 선택하세요.
                  </FormDescription>
                  <div className="grid grid-cols-1 gap-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={field.value?.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, member.id]);
                            } else {
                              field.onChange(field.value.filter(id => id !== member.id));
                            }
                          }}
                        />
                        <Label htmlFor={`member-${member.id}`}>
                          {member.display_name}
                          <span className="text-muted-foreground ml-1">({member.timezone})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rotation Enabled */}
            <FormField
              control={form.control}
              name="rotation_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">순환 시스템</FormLabel>
                    <FormDescription>
                      공정한 시간대 부담 분배를 위한 순환 시스템을 활성화합니다.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="btn-gradient">
                <Save className="h-4 w-4 mr-2" />
                {loading ? '저장 중...' : '규칙 저장'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RulesForm;