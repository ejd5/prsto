import { redirect } from "next/navigation";

// L'ancienne page /elton-os redirige maintenant vers la landing /prsto
export default function EltonOSRedirect() {
  redirect("/prsto");
}
