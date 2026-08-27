declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

export const ONESIGNAL_APP_ID = "f2607890-0ba3-47f1-a2bd-282477e73555";

/**
 * Execute a callback once OneSignal is initialized
 */
export function withOneSignal(callback: (oneSignal: any) => void | Promise<void>) {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await callback(OneSignal);
    } catch (err) {
      console.info("OneSignal operation notice:", err);
    }
  });
}

/**
 * Request notification permission or opt-in
 */
export function requestPushPermission() {
  withOneSignal(async (OneSignal) => {
    try {
      if (OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
        await OneSignal.Notifications.requestPermission();
      } else if (OneSignal.showSlidedownPrompt) {
        await OneSignal.showSlidedownPrompt();
      }
    } catch (err) {
      console.warn("OneSignal permission request notice:", err);
    }
  });
}

/**
 * Associate user ID with OneSignal for targeted push notifications
 */
export function setOneSignalUser(externalUserId: string) {
  withOneSignal(async (OneSignal) => {
    try {
      if (OneSignal.login) {
        await OneSignal.login(externalUserId);
      }
    } catch (err) {
      console.warn("OneSignal user login notice:", err);
    }
  });
}

/**
 * Remove user ID association on logout
 */
export function logoutOneSignalUser() {
  withOneSignal(async (OneSignal) => {
    try {
      if (OneSignal.logout) {
        await OneSignal.logout();
      }
    } catch (err) {
      console.warn("OneSignal user logout notice:", err);
    }
  });
}
