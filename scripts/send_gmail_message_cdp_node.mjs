import fs from "fs";
import { setTimeout as sleep } from "timers/promises";
import { URL, URLSearchParams } from "url";

const CDP_HTTP = "http://127.0.0.1:9223";
const AUTHUSER = "rumedsodimana@gmail.com";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function connectWebSocket(wsUrl) {
  return await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      try {
        socket.close();
      } catch {}
      reject(new Error(`Timed out connecting to ${wsUrl}`));
    }, 10000);

    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.addEventListener("error", (event) => {
      clearTimeout(timer);
      reject(new Error(event.message || "WebSocket connection failed"));
    });
  });
}

async function parseSocketEvent(event) {
  let data = event.data;
  if (typeof data !== "string") {
    if (data instanceof Blob) {
      data = await data.text();
    } else if (data instanceof ArrayBuffer) {
      data = Buffer.from(data).toString("utf8");
    }
  }
  return JSON.parse(String(data));
}

function createCdpClient(socket) {
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", async (event) => {
    const message = await parseSocketEvent(event);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id).resolve(message);
      pending.delete(message.id);
    }
  });

  socket.addEventListener("close", () => {
    for (const { reject } of pending.values()) {
      reject(new Error("CDP socket closed"));
    }
    pending.clear();
  });

  return {
    async send(method, params = {}) {
      const id = nextId++;
      const payload = { id, method, params };
      const promise = new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
      socket.send(JSON.stringify(payload));
      return await promise;
    },
  };
}

function createTargetMessenger(socket, client, sessionId) {
  let nextTargetId = 1;

  async function waitForTargetResponse(expectedId, timeoutMs = 15000) {
    return await new Promise((resolve, reject) => {
      let timer;

      const onMessage = async (event) => {
        const message = await parseSocketEvent(event);
        if (message.method !== "Target.receivedMessageFromTarget") {
          return;
        }
        if (message.params?.sessionId !== sessionId) {
          return;
        }

        const inner = JSON.parse(message.params.message);
        if (inner.id !== expectedId) {
          return;
        }

        clearTimeout(timer);
        socket.removeEventListener("message", onMessage);

        if (inner.error) {
          reject(new Error(inner.error.message || JSON.stringify(inner.error)));
          return;
        }

        resolve(inner);
      };

      timer = setTimeout(() => {
        socket.removeEventListener("message", onMessage);
        reject(new Error(`Timed out waiting for target response ${expectedId}`));
      }, timeoutMs);

      socket.addEventListener("message", onMessage);
    });
  }

  return {
    async send(method, params = {}, timeoutMs = 15000) {
      const id = nextTargetId++;
      const responsePromise = waitForTargetResponse(id, timeoutMs);
      await client.send("Target.sendMessageToTarget", {
        sessionId,
        message: JSON.stringify({ id, method, params }),
      });
      return await responsePromise;
    },
  };
}

function buildComposeUrl(toEmail, subject, body) {
  const url = new URL("https://mail.google.com/mail/");
  url.search = new URLSearchParams({
    view: "cm",
    fs: "1",
    tf: "1",
    authuser: AUTHUSER,
    to: toEmail,
    su: subject,
    body,
  }).toString();
  return url.toString();
}

async function main() {
  const [toEmail, subject, bodyFile] = process.argv.slice(2);
  if (!toEmail || !subject || !bodyFile) {
    console.error(
      "Usage: node scripts/send_gmail_message_cdp_node.mjs <to> <subject> <body_file>",
    );
    process.exit(1);
  }

  const body = fs.readFileSync(bodyFile, "utf8");
  const composeUrl = buildComposeUrl(toEmail, subject, body);
  const version = await fetchJson(`${CDP_HTTP}/json/version`);
  const browserSocket = await connectWebSocket(version.webSocketDebuggerUrl);
  const client = createCdpClient(browserSocket);

  const createTarget = await client.send("Target.createTarget", { url: composeUrl });
  const targetId = createTarget.result.targetId;
  const attach = await client.send("Target.attachToTarget", {
    targetId,
    flatten: false,
  });
  const sessionId = attach.result.sessionId;
  const target = createTargetMessenger(browserSocket, client, sessionId);

  try {
    await client.send("Target.activateTarget", { targetId });
    await sleep(5000);

    const clickResult = await target.send(
      "Runtime.evaluate",
      {
        expression: `
          (async () => {
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const getState = (status) => ({
              status,
              title: document.title,
              url: location.href,
              text: document.body ? document.body.innerText.slice(0, 1000) : "",
            });
            const findSendButton = () =>
              [...document.querySelectorAll('div[role="button"][data-tooltip^="Send"]')]
                .find((node) => node && node.offsetParent !== null);

            for (let i = 0; i < 120; i += 1) {
              const sendButton = findSendButton();
              if (sendButton) {
                sendButton.click();
                return getState("clicked");
              }
              await wait(250);
            }

            return getState("missing_send_button");
          })()
        `,
        awaitPromise: true,
        returnByValue: true,
      },
      30000,
    );

    const clickValue = clickResult.result.result?.value;
    if (clickValue?.status !== "clicked") {
      throw new Error(JSON.stringify(clickValue));
    }

    const confirmation = await target.send(
      "Runtime.evaluate",
      {
        expression: `
          (async () => {
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const getState = (status) => ({
              status,
              title: document.title,
              url: location.href,
              text: document.body ? document.body.innerText.slice(0, 1000) : "",
            });
            const hasConfirmation = () => {
              const text = document.body?.innerText || "";
              if (text.includes("Message sent")) return true;
              return [...document.querySelectorAll('*')].some((node) => node.textContent === "Undo");
            };

            for (let i = 0; i < 120; i += 1) {
              if (hasConfirmation()) {
                return getState("sent");
              }
              await wait(250);
            }

            return getState("missing_confirmation");
          })()
        `,
        awaitPromise: true,
        returnByValue: true,
      },
      30000,
    );

    const confirmationValue = confirmation.result.result?.value;
    if (confirmationValue?.status !== "sent") {
      throw new Error(JSON.stringify(confirmationValue));
    }

    console.log("SENT");
  } finally {
    try {
      await client.send("Target.detachFromTarget", { sessionId });
    } catch {}
    try {
      browserSocket.close();
    } catch {}
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
