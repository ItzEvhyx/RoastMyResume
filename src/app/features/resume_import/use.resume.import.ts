'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/app/core/session/session';
import { resetForImport } from '@/app/features/resume_templates/apply';
import { startResumeImport } from './import.store';
import { RESUME_IMPORT_MAX_BYTES } from './types';

/** File picker → start upload → go straight to /canvas (which shows progress). */
export function useResumeImport() {
  const router = useRouter();
  const user = useAuthUser();
  const email = user?.email ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const openPicker = useCallback(() => {
    if (!email) {
      setError('Sign in to import your resume.');
      return;
    }
    setError(null);
    inputRef.current?.click();
  }, [email]);

  const handleFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !email) return;

      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setError('Only PDF files are supported.');
        return;
      }
      if (file.size > RESUME_IMPORT_MAX_BYTES) {
        setError('That PDF is too large. Max size is 5 MB.');
        return;
      }

      setError(null);
      resetForImport();
      startResumeImport(file, email);
      router.push('/canvas');
    },
    [email, router],
  );

  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: 'application/pdf,.pdf',
    className: 'hidden',
    onChange: handleFile,
  };

  return { openPicker, inputProps, error };
}
