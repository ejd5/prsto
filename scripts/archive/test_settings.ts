import { updateSettings } from "./lib/actions/settings";
import { prisma } from "./lib/prisma";

async function test() {
  try {
    const res = await updateSettings({ apiKey: "sk-test12345" });
    console.log("Success:", res);
    
    const db = await prisma.setting.findFirst();
    console.log("In DB:", db?.apiKey);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
