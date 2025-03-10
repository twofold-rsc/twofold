import "server-only";
import { getStore } from "../../backend/stores/rsc-store";
import { SerializeOptions } from "cookie";

let cookies = {
  all() {
    let store = getStore();

    let outgoing = store.cookies.outgoingCookies().map((c) => ({
      name: c.name,
      value: c.value,
    }));

    let cookieNames = Object.keys(store.cookies.all());

    let all = cookieNames.reduce<{ name: string; value: string | undefined }[]>(
      (list, name) => {
        return list.some((c) => c.name === name)
          ? list
          : [
              ...list,
              {
                name,
                value: store.cookies.get(name),
              },
            ];
      },
      outgoing,
    );

    return all;
  },

  get(name: string) {
    let store = getStore();
    let outgoing = store.cookies.outgoingCookies().find((c) => c.name === name);
    return outgoing?.value ?? store.cookies.get(name);
  },

  set(name: string, value: string, options?: SerializeOptions) {
    let store = getStore();
    // TODO: don't allow setting cookies during render
    store.cookies.set(name, value, options);
  },

  destroy(name: string, options?: SerializeOptions) {
    let store = getStore();
    store.cookies.destroy(name, options);
  },

  encrypted: {
    async set(name: string, value: any, options?: SerializeOptions) {
      let store = getStore();
      let encryptedValue = await store.encryption.encrypt([name, value]);
      cookies.set(`tfec_${name}`, encryptedValue, options);
    },
    async get(name: string) {
      let store = getStore();
      let encryptedValue = cookies.get(`tfec_${name}`);
      if (!encryptedValue) {
        return undefined;
      }

      try {
        let [storedName, value] =
          await store.encryption.decrypt(encryptedValue);
        if (storedName !== name) {
          return undefined;
        }
        return value;
      } catch (e) {
        return undefined;
      }
    },
    destroy(name: string, options?: SerializeOptions) {
      cookies.destroy(`tfec_${name}`, options);
    },
  },
};

export default cookies;
