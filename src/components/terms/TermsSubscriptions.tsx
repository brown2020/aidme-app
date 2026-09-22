interface TermsSubscriptionsProps { companyName: string; companyEmail: string }

/** Terms section: Subscriptions */
export function TermsSubscriptions({ companyName, companyEmail }: TermsSubscriptionsProps) {
  return (
    <>
<h4>Subscriptions</h4>
      <p>
        Certain Paid Services are subscription-based purchases, to which the
        following terms apply:
      </p>
      <p>
        Your Subscription term may vary as a continuous, monthly, or annual term
        (“Subscription Term(s)”), as described in the course of purchasing the
        Paid Services. Your Subscription will auto-renew for additional
        Subscription Terms until your Subscription is canceled by you, or
        suspended or terminated by {companyName}. Unless otherwise indicated by
        us, your designated payment method will be charged prior to, or at the
        beginning of, each Subscription Term for the Subscription fee plus any
        applicable taxes and other charges. Before charging you for a
        Subscription Term, we will notify you of the applicable fees, and the
        renewal will occur at the price then in effect for the Paid Service.
      </p>
      <p>
        You may cancel your Subscription at any time. Your cancellation will
        take effect at the end of the current Subscription Term. To cancel your
        subscription and automatic payment, click on the “View Subscription”
        button from your account screen to go to the Stripe customer portal
        where you can manage or cancel your subscription, or email us at{" "}
        {companyEmail}. Cancellation does not entitle you to the refund of any
        previously paid Fees and you will not receive a prorated refund for the
        remainder of the Subscription Term. In the event you cancel your
        Subscription, note that we may still send you promotional
        communications, unless you opt out of receiving those communications by
        following the unsubscribe instructions provided in the communications.
      </p>
      <p>
        When you cancel a Subscription, you cancel only future charges for your
        Subscription. You will not receive a refund for the current Subscription
        Term you paid for, but you will continue to have full access to that
        Subscription until the end of that current Subscription Term. At any
        time for any reason, we may provide a refund, discount, or other
        consideration (“credits”) to some or all of our users. The amount and
        form of such credits, and the decision to provide them, are at our sole
        and absolute discretion. The provision of credits in one instance does
        not entitle you to credits in the future for similar instances, nor does
        it obligate us to provide credits in the future.
      </p>
      <p>
        If you reside outside the United States and change your mind about your
        purchase, you may be entitled to receive a full refund within fourteen
        (14) days (the “Cooling-Off Period”), provided that you have not logged
        in or otherwise redeemed or started to use the Services as a subscriber
        during the Cooling-Off Period.
      </p>
      <p>
        From time to time, we may offer free trials of certain Subscriptions for
        specified periods of time without payment. Prior to starting your free
        trial we will notify you of the applicable Subscription fees that will
        be charged at the expiration of your free trial. Unless you cancel your
        Subscription prior to the end of your free trial by taking the steps
        outlined above, when your free trial ends, we or our third-party payment
        processor will bill your designated payment method on a recurring basis
        for your Subscription fee, plus any applicable taxes and other charges,
        for as long as your Subscription continues. You must cancel your
        Subscription before the end of your free trial period to avoid any
        charges. Instructions for canceling your Subscription are described
        above.
      </p>
      <p>
        Your payment information will be processed and stored through a
        third-party payment processor. All paid account holders must maintain at
        least one valid payment method for payment of Fees, which are described
        in more detail during checkout. All Fees are calculated and billed to
        you on a monthly or annual basis depending upon your choice, and are due
        immediately upon receipt and are subject to change. You acknowledge that
        Fees have a recurring payment feature and you accept responsibility for
        all recurring charges prior to cancellation. Fees shall be charged or
        debited from the saved, designated payment method you provide one day
        prior to the monthly or yearly anniversary of the initial purchase date.
      </p>
      <p>
        In the event that you have not logged in or otherwise used the Services
        for six (6) months, we reserve the right to terminate your subscription
        and cancel any pending purchase(s). You will not be entitled to a refund
        for the value of the Subscription during the free trial.
      </p>
      <p>
        {companyName} reserves the right to adjust the Fees for our Paid
        Services, or any features or parts of our Paid Services, at any time.
        You acknowledge that {companyName} may change the Fees for Paid Services
        at any time. In the event of such a change, {companyName}
        will provide notice to you via the email address associated with your
        account at least thirty (30) days in advance of the effective date of
        the change. Your continued use of the Services indicates your acceptance
        of any changes to the Fees. You are solely responsible for all
        applicable taxes, and will be charged for taxes when required by law.
      </p>
    </>
  );
}
