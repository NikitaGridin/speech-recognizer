import ClientOnly from "@/client-only";
import A from "@/feat/a/a";

type Props = {};

export default function page({}: Props) {
  return (
    <ClientOnly>
      <A />
    </ClientOnly>
  );
}
