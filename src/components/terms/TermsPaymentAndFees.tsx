interface TermsPaymentAndFeesProps { companyName: string }

/** Terms section: Payment and Fees */
export function TermsPaymentAndFees({ companyName }: TermsPaymentAndFeesProps) {
  return (
    <>
<h4>Payment and Fees</h4>
      <p>
        Paid Services include the Services, which may be one-time purchases or
        automatically renewing subscription services (“Paid Services”),
        including our Sites and Mobile Apps (“Subscriptions”). We may make
        changes to, suspend, or discontinue Paid Services at any time for any
        reason, and {companyName} reserves the sole discretion to determine
        which Services or portions thereof require payment.
      </p>
      <p>
        Paid Services may include pre-ordered products that will be produced for
        you in the future (“Pre-Order”). You will be charged a Pre-Order fee
        when placing your Pre-Order. The actual date for shipping any accepted
        Pre-Order will depend on a variety of factors, including but not limited
        to, the date of payment of your Pre-Order fee and {companyName}’s
        production schedule. There is no shipping date guarantee for Pre-Orders.
      </p>
      <p>
        You agree to pay all applicable fees for Paid Services including,
        without exclusion, any monthly subscription fees, user fees, and
        offering fees and any other fees, charges, or costs that you agree to
        purchase as part of the Paid Services during the checkout process
        (“Fees”). You agree to pay all Fees and all applicable taxes incurred
        prior to termination or cancellation of the Agreement.
      </p>
      <p>
        You authorize {companyName} to charge your designated payment method for
        Paid Services. By providing an acceptable payment method, you represent
        and warrant that you are authorized to use the designated payment method
        and that you authorize us or our third-party payment processor to charge
        your payment method for the total amount of your purchase, including any
        applicable taxes and other charges. If the payment method cannot be
        verified, is invalid, or is otherwise not acceptable, your Paid Service
        may be suspended or canceled. You must resolve any problem we encounter
        in relation to the payment method you provide in order to proceed with
        your use of the Service. If you accept a promotional offer or make
        changes to your Paid Services, the Fees, taxes, and amounts billed may
        vary. Billing amounts may also vary due to changes in applicable taxes
        or currency exchange rates. You authorize us or our third-party payment
        processor to charge your payment method for the corresponding amount.
        Refunds will not be issued unless required by law. This payment
        obligation shall survive termination or cancellation of this Agreement
        for any reason whatsoever.
      </p>
      <p>
        If you choose to finance a purchase through our third-party payment
        processor and one or more items in your order has an extended ship date,
        your loan payment(s), including interest, may be due before we ship all
        of the items. Please note that you may not receive a rebate of any
        interest that may have already accrued on an amount that is later
        refunded.
      </p>
    </>
  );
}
