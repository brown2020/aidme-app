interface TermsAccountsAndLiveSharingProps {
  companyName: string;
}

export function TermsAccountsAndLiveSharing({ companyName }: TermsAccountsAndLiveSharingProps) {
  return (
    <>
      <h4>Accounts, Live Sharing, and Recording</h4>
      <p>
        Captions on your own device do not require an account. If you create an
        account, you are responsible for keeping your sign-in details secure and
        for all activity under your account.
      </p>
      <p>
        When you turn on live sharing, the text of what is recognized near your
        device is saved to your account and shown to the people you invite. You
        are responsible for choosing whom you invite and for making sure that
        everyone whose speech may be transcribed knows and agrees, as required by
        the laws where you are. Do not use live sharing to capture conversations
        you are not permitted to record.
      </p>
      <p>
        Invited people can read a shared session only while they are signed in
        with the invited email address, and you can stop sharing, remove people,
        or delete sessions at any time. You can delete your account from the
        account page, which permanently removes your account and the sessions
        you shared.
      </p>
      <p>
        Captions are generated automatically by your browser&apos;s speech
        recognition and may be incomplete or inaccurate. {companyName} does not
        guarantee their accuracy, and they should not be relied on where a
        mistake could cause harm.
      </p>
    </>
  );
}
