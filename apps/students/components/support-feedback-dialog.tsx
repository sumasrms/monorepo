'use client';

import { useMemo, useState } from 'react';
import { gql } from 'graphql-request';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { graphqlClient, getErrorMessage } from '@/lib/graphql-client';

type SupportFeedbackKind = 'SUPPORT' | 'FEEDBACK';

type SupportFeedbackDialogProps = {
  type: SupportFeedbackKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SUBMIT_SUPPORT_FEEDBACK = gql`
  mutation SubmitSupportFeedback($input: SubmitSupportFeedbackDto!) {
    submitSupportFeedback(input: $input)
  }
`;

export function SupportFeedbackDialog({
  type,
  open,
  onOpenChange,
}: SupportFeedbackDialogProps) {
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const title = useMemo(
    () => (type === 'SUPPORT' ? 'Contact Support' : 'Share Feedback'),
    [type],
  );

  const categories = useMemo(
    () =>
      type === 'SUPPORT'
        ? ['Portal Access', 'Payments', 'Results', 'Other']
        : ['Suggestion', 'User Experience', 'Performance', 'Other'],
    [type],
  );

  const resetForm = () => {
    setCategory('');
    setPriority('MEDIUM');
    setSubject('');
    setMessage('');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!category || !subject.trim() || !message.trim()) {
      setErrorMessage('Please complete category, subject, and message.');
      return;
    }

    if (message.trim().length < 10) {
      setErrorMessage('Message must be at least 10 characters.');
      return;
    }

    try {
      setLoading(true);
      await graphqlClient.request(SUBMIT_SUPPORT_FEEDBACK, {
        input: {
          type,
          category,
          priority,
          subject: subject.trim(),
          message: message.trim(),
          portalType: 'student',
          currentPath: window.location.pathname,
        },
      });

      setSuccessMessage(
        type === 'SUPPORT'
          ? 'Support request submitted successfully'
          : 'Feedback submitted successfully',
      );
      resetForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) {
          resetForm();
          setErrorMessage(null);
          setSuccessMessage(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Submit your request and our team will follow up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-green-600">{successMessage}</p>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Category</label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Priority</label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              maxLength={120}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Brief summary"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={message}
              maxLength={2000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe your issue or suggestion"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
