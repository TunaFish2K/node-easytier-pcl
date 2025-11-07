/**
 * check if the invitation code is valid,
 * the code is invalid if:
 * - code doesn't start with 'P'
 * - code[5] or code[11] or code[17] is't '-'
 * - code[1:5] isn't a valid hex string (port)
 * - code[18:20] isn't 02 (wrong version)
 * - code[20:23] isn't a valid hex string (init node id)
 * - code[0:23] contains something other than 0-9A-Z^I^O
 * @param code
 * @returns
 */
export function isInvitationCodeValid(code: string) {
    if (code.length < 23) return false;
    if (code[0] !== "P") return false;
    if (code[5] !== "-") return false;
    if (code[11] !== "-") return false;
    if (code[17] !== "-") return false;
    if (code.slice(18, 20) !== "02") return false;
    if (Number.isNaN(parseInt(code.slice(1, 5), 16))) return false;
    if (Number.isNaN(parseInt(code.slice(20, 23), 16))) return false;
    if (
        [...code.slice(0, 23)].findIndex(
            (c) =>
                [..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-"]
                    .filter((c0) => !["O", "I"].includes(c0))
                    .indexOf(c) === -1
        ) !== -1
    )
        return false;
    return true;
}

/**
 * create the invitation code
 * @param port the port the minecraft server is listening at
 * @param param1
 * @param param1.attachment optional text attached to the tail of the code
 * @param param1.nodeID the id of the initial node
 * @returns you need to parse the code to get the easy tier information
 */
export function generateInvitationCode(
    port: number,
    {
        attachment,
        nodeID = 0,
    }: {
        attachment?: string;
        nodeID: number;
    }
) {
    if (port % 1 !== 0 || port < 0 || port > 65535)
        throw new Error("port is invalid!");
    if (nodeID % 1 !== 0 || nodeID < 0 || nodeID > 4095)
        throw new Error("nodeID is invalid!");
    function generate() {
        let result: string[] = [];
        for (let i = 0; i < 5; i++) {
            result.push(
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
                    Math.floor(Math.random() * 36)
                ]!
            );
        }
        return result.join("");
    }
    return (
        `P${port
            .toString(16)
            .padStart(4, "0")}-${generate()}-${generate()}-02${nodeID
            .toString(16)
            .padStart(3, "0")}`
            .replaceAll("O", "0")
            .replaceAll("I", "1")
            .toUpperCase() + (attachment ?? "")
    );
}

/**
 * parse a invitation code
 * @param code
 */
export function parseInvitationCode(code: string) {
    if (!isInvitationCodeValid(code)) {
        throw new Error("invitation code is invalid!");
    }
    const port = parseInt(code.slice(1, 5), 16);
    const networkName = code.slice(0, 11);
    const networkSecret = code.slice(12, 17);
    const nodeID = parseInt(code.slice(20, 23), 16);
    const attachment = code.slice(23);

    return {
        port,
        networkName,
        networkSecret,
        nodeID,
        attachment: attachment.length > 6 ? attachment : undefined,
    };
}

export type InvitationCodeData = ReturnType<typeof parseInvitationCode>;

/**
 * get available nodes from the easytier uptime api (https://uptime.easytier.cn/api/nodes)
 * @returns a string array containing urls of all available nodes
 */
export async function getAvailableNodes(tags: string[] = ["MC"]) {
    let page = 1;
    let totalPage = 0;

    let nodes = [];

    async function fetchPage(page: number) {
        const url = new URL("https://uptime.easytier.cn/api/nodes");
        for (const tag of tags) {
            url.searchParams.set("tags", tag);
        }
        url.searchParams.set("per_page", "200");
        url.searchParams.set("page", page.toString());

        const result = (await (await fetch(url)).json()) as {
            success: boolean;
            data: {
                items: {
                    address: string;
                }[];
                total_pages: number;
            };
            error: string | null;
            message: string | null;
        };
        if (!result.success) {
            throw new Error(`${result.error}, ${result.message}`);
        }

        return {
            nodes: result.data.items.map((v) => v.address),
            totalPages: result.data.total_pages,
        };
    }

    while (true) {
        const result = await fetchPage(page);
        nodes.push(...result.nodes);
        if (page >= result.totalPages) break;
        page += 1;
    }

    return nodes;
}

const ENCRYPTION_ALGORITHM = "chacha20";
const HOST_IP = "10.114.114.114";

/**
 * generate command line arguments for easytier.
 * @param param0
 * @param param0.invitationCode
 * @param param0.nodes the urls of easytier nodes, you can call `getAvailableNodes` to get ones recorded on the easytier uptime api
 * @param param0.role whether the machine is hosting the minecraft server
 * @param param0.hostname if being server, a hostname must be provided. format like `Server-${name}` is suggested
 * @param param0.hostnameSuffix if being client, a suffix must be provided
 * @param param0.portToForWard if being client, the remote server need to be forwarded to a local port
 */
export function generateEasyTierArguments({
    invitationCode,
    nodes,
    ...rest
}: {
    invitationCode: string;
    nodes: string[];
} & (
    | {
          role: "host";
          hostname: string;
      }
    | { role: "client"; hostnameSuffix: string; portToForward: number }
)): string[] {
    const data = parseInvitationCode(invitationCode);
    const result = [];

    result.push(`--encryption-algorithm=${ENCRYPTION_ALGORITHM}`);

    // nodes arguments
    for (const node of nodes) {
        result.push("-p");
        result.push(`${node}`);
    }

    result.push(`--network-name=${data.networkName}`);
    result.push(`--network-secret=${data.networkSecret}`);

    if (rest.role == "host") {
        // a fixed ip for the host, defining the only host
        result.push("-i");
        result.push(`${HOST_IP}`);
        // hostname
        result.push(`--hostname=${rest.hostname}`);

        // allow connection to the minecraft server only, for safety concerns
        result.push(`--tcp-whitelist=${data.port}`);
        result.push(`--udp-whitelist=${data.port}`);
    } else {
        // create a valid hostname
        result.push(`--hostname=Client${rest.hostnameSuffix}`);
        // local port forwarding
        result.push(
            ...["tcp", "udp"].flatMap((protocol) =>
                ["[::1]", "127.0.0.1"].map(
                    (address) =>
                        `--port-forward=${protocol}://${address}:${rest.portToForward}/${HOST_IP}:${data.port}`
                )
            )
        );
        // disallow being connected, for safety concerns
        result.push(`--tcp-whitelist=0`);
        result.push(`--udp-whitelist=0`);
        result.push("-d");
    }

    return result;
}
