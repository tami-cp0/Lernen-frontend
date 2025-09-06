import { cleanEnv, url } from "envalid";

// only validates on server side

function safeReporter({ errors }: { errors: Record<string, Error> }) {
  const keys = Object.keys(errors);
  if (keys.length > 0) {
    console.log('================================================');
    console.log(' Invalid environment variables:');
    for (const key of keys) {
      const  message = errors[key].message || '';
      console.error(`    ${key}: ${message.endsWith('"') ? message.split(':')[0] : message }`);
    }
    console.log('================================================');
    process.exit(1);
  }
}

// Single validation pass
const env = cleanEnv(
  process.env,
  {
    // server

    // client (must start with NEXT_PUBLIC_)
    NEXT_PUBLIC_API_URL: url(),
  },
  { reporter: safeReporter }
);

// Export grouped env
export const serverEnv = {
};
