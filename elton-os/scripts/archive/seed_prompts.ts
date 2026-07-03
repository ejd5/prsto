import { seedDefaultPrompts } from "./lib/actions/settings";

async function run() {
  try {
    const count = await seedDefaultPrompts();
    console.log(`Successfully seeded ${count} prompts.`);
  } catch (e) {
    console.error("Failed to seed:", e);
  }
}
run();
