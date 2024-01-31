import PrivacyPage from "@/components/PrivacyPage";

type Props = {};
export default function Privacy({}: Props) {
  return (
    <PrivacyPage
      companyName={"Ignite Channel"}
      companyEmail={"info@ignitechannel.com"}
      companyAddress={"30765 Pacific Coast Hwy, Suite 354"}
      companyLocation={"Malibu, CA"}
      updatedAt={"November 1, 2023"}
    />
  );
}
