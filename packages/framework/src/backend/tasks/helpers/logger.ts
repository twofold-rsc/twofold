export const logger = {
  build({ key, time }: { key: string; time: number }) {
    console.log(`🏗️  Built app in ${time.toFixed(2)}ms [version: ${key}]`);
  },
};
