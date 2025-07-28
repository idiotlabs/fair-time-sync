import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, TestTube, CheckCircle } from 'lucide-react';
import { generateTestICSFiles, downloadAllTestFiles, generateTestCases, formatTimeInTimezone } from '@/lib/calendar-utils';
import { toast } from 'sonner';

const CalendarQATest = () => {
  const testCases = generateTestCases();

  const handleDownloadTestFiles = () => {
    try {
      downloadAllTestFiles();
      toast.success('QA test files downloaded! Check each file in Google Calendar, Outlook, and Apple Calendar.');
    } catch (error) {
      toast.error('Failed to generate test files');
      console.error('QA test error:', error);
    }
  };

  const handleDownloadSingleTest = (index: number) => {
    try {
      const testFiles = generateTestICSFiles();
      const file = testFiles[index];
      
      const blob = new Blob([file.content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${file.name} test file`);
    } catch (error) {
      toast.error('Failed to download test file');
      console.error('Test file download error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Calendar QA Testing
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test ICS file compatibility across Google Calendar, Outlook, and Apple Calendar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleDownloadTestFiles} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download All Test Files (4 files)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <Card key={index} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{testCase.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {testCase.timezone}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">Start:</span>
                      <span className="text-muted-foreground">
                        {formatTimeInTimezone(testCase.startTime, testCase.timezone)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">End:</span>
                      <span className="text-muted-foreground">
                        {formatTimeInTimezone(testCase.endTime, testCase.timezone)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {testCase.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadSingleTest(index)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              QA Checklist
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Import each ICS file into Google Calendar, Outlook, and Apple Calendar</li>
              <li>• Verify event times display correctly in each application</li>
              <li>• Check that long descriptions are properly formatted (no line break issues)</li>
              <li>• Confirm attendee information appears correctly</li>
              <li>• Test DST transition events show proper time handling</li>
              <li>• Validate cross-date boundary events span correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarQATest;