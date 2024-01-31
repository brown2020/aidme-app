import TermsPage from "@/components/TermsPage";

type Props = {};
export default function Terms({}: Props) {
  return (
    <TermsPage
      privacyLink={"/privacy"}
      companyName={"Ignite Channel"}
      companyEmail={"info@ignitechannel.com"}
      updatedAt={"November 1, 2023"}
    />
  );
}
