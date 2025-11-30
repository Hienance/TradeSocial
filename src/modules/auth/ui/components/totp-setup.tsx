"use client";
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

interface Props { className?: string }


export const TotpSetup: React.FC<Props> = ({ className }) => {
  const trpc = useTRPC();
  // Status query
  const { data: statusData, refetch: refetchStatus, isLoading: statusLoading } = useQuery(
    trpc.mfaTotp.status.queryOptions()
  );
  // Mutations
  const enrollMutation = useMutation(trpc.mfaTotp.enroll.mutationOptions());
  const verifyMutation = useMutation(trpc.mfaTotp.verify.mutationOptions());
  const challengeMutation = useMutation(trpc.mfaTotp.challenge.mutationOptions());
  const disableMutation = useMutation(trpc.mfaTotp.disable.mutationOptions());

  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'idle'|'enrolling'|'verifying'|'challenging'>('idle');

  useEffect(() => {
    if (otpauth) {
      QRCode.toDataURL(otpauth).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    }
  }, [otpauth]);

  const startEnroll = async () => {
    setPhase('enrolling');
    try {
      const data = await enrollMutation.mutateAsync();
      setOtpauth(data.otpauth);
      setManualSecret(data.secret);
      setPhase('verifying');
    } catch (e) {
      // Show server error message if enroll fails fast
      // eslint-disable-next-line no-console
      console.error(e);
      setPhase('idle');
    }
  };

  const submitVerify = async () => {
    try {
      await verifyMutation.mutateAsync({ code });
      await refetchStatus();
      setPhase('idle');
      setCode('');
    } catch {}
  };

  const submitChallenge = async () => {
    setPhase('challenging');
    try {
      await challengeMutation.mutateAsync({ code });
      await refetchStatus();
      setPhase('idle');
      setCode('');
    } catch {
      setPhase('idle');
    }
  };

  const disable = async () => {
    await disableMutation.mutateAsync();
    await refetchStatus();
    setOtpauth(null);
    setManualSecret(null);
    setCode('');
    setPhase('idle');
  };

  const loading = statusLoading;
  const enabled = statusData?.enabled;

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">TOTP Multi‑Factor Authentication</h2>
        {loading && <Spinner />}
        {!loading && (
          <>
            <p className="text-sm text-muted-foreground">
              {enabled ? 'TOTP is enabled. Use a current code to refresh verification.' : 'Add an authenticator app (Google Authenticator, Authy, etc.).'}
            </p>
            <Separator />
            {!enabled && !otpauth && (
              <Button onClick={startEnroll} disabled={enrollMutation.isPending}>Begin Enrollment</Button>
            )}
            {!enabled && otpauth && (
              <div className="space-y-3">
                <p className="text-sm">Scan this QR with your authenticator app, then enter the 6-digit code.</p>
                {qrDataUrl ? <img src={qrDataUrl} alt="TOTP QR" className="w-40 h-40" /> : <Spinner />}
                <p className="text-xs break-all">Manual secret: <code>{manualSecret}</code></p>
                <div className="flex gap-2 items-center">
                  <Input placeholder="123456" value={code} onChange={e => setCode(e.target.value)} maxLength={10} />
                  <Button onClick={submitVerify} disabled={verifyMutation.isPending || code.length < 6}>Verify & Enable</Button>
                </div>
              </div>
            )}
            {enabled && (
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Input placeholder="Current code" value={code} onChange={e => setCode(e.target.value)} maxLength={10} />
                  <Button variant="secondary" onClick={submitChallenge} disabled={challengeMutation.isPending || code.length < 6}>Validate Code</Button>
                  <Button variant="destructive" onClick={disable} disabled={disableMutation.isPending}>Disable</Button>
                </div>
                <p className="text-xs text-muted-foreground">Provide a valid code to refresh your 12h verification window.</p>
              </div>
            )}
            {(verifyMutation.isError || enrollMutation.isError || challengeMutation.isError) && (
              <p className="text-xs text-red-600">
                {verifyMutation.error?.message || enrollMutation.error?.message || challengeMutation.error?.message || 'Action failed. Check code and try again.'}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default TotpSetup;