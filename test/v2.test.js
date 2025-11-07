// @ts-check

const v2 = require("../dist/v2");

test("parse invitation code v2", () => {
    // without attachment
    expect(v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-02000")).toMatchObject({
        port: 4095,
        networkName: "P0FFF-ABCDE",
        networkSecret: "H1JKL",
        nodeID: 0,
        attachment: undefined
    });
    // with attachment
    expect(v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-02000-attachment")).toMatchObject({
        port: 4095,
        networkName: "P0FFF-ABCDE",
        networkSecret: "H1JKL",
        nodeID: 0,
        attachment: "-attachment"
    });
    // with non-zero nodeID
    expect(v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-021FF")).toMatchObject({
        port: 4095,
        networkName: "P0FFF-ABCDE",
        networkSecret: "H1JKL",
        nodeID: 511,
        attachment: undefined
    });
    // throw if invalid port hex string
    expect(() => v2.parseInvitationCode("PZZZZ-ABCDE-H1JKL-02000")).toThrow();
    // throw if bad format - wrong starting character
    expect(() => v2.parseInvitationCode("Q0FFF-ABCDE-H1JKL-02000")).toThrow();
    // throw if bad format - missing first dash
    expect(() => v2.parseInvitationCode("P0FFFFABCDE-H1JKL-02000")).toThrow();
    // throw if bad format - missing second dash
    expect(() => v2.parseInvitationCode("P0FFF-ABCDEEH1JKL-02000")).toThrow();
    // throw if bad format - missing third dash
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKL02000")).toThrow();
    // throw if lower case
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKl-02000")).toThrow();
    // throw if I or O found
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-HIJKL-02000")).toThrow();
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-HOJKL-02000")).toThrow();
    // throw if wrong version number
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-01000")).toThrow();
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-03000")).toThrow();
    // throw if invalid nodeID hex string
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-02ZZZ")).toThrow();

    // check if it can correctly throw when invalid character is at the end to test if the code is fully checked
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKO-02000")).toThrow();
    expect(() => v2.parseInvitationCode("P0FFF-ABCDE-H1JKI-02000")).toThrow();

    // test edge cases for nodeID
    expect(v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-02FFF").nodeID).toBe(4095);
    expect(v2.parseInvitationCode("P0FFF-ABCDE-H1JKL-02001").nodeID).toBe(1);
});

test("validate invitation code v2", () => {
    // valid codes
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-02000")).toBe(true);
    expect(v2.isInvitationCodeValid("P1234-56789-ABCDE-02FFF")).toBe(true);

    // invalid codes - wrong starting character
    expect(v2.isInvitationCodeValid("Q0FFF-ABCDE-H1JKL-02000")).toBe(false);

    // invalid codes - wrong dash positions
    expect(v2.isInvitationCodeValid("P0FFFFABCDE-H1JKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDEEH1JKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL02000")).toBe(false);

    // invalid codes - wrong version
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-01000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-03000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-00000")).toBe(false);

    // invalid codes - bad port hex
    expect(v2.isInvitationCodeValid("PGGGG-ABCDE-H1JKL-02000")).toBe(false);

    // invalid codes - bad nodeID hex
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-02GGG")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-02XYZ")).toBe(false);

    // invalid codes - forbidden characters I and O
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-HIJKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-HOJKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("POFFF-ABCDE-H1JKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("PIFFF-ABCDE-H1JKL-02000")).toBe(false);

    // invalid codes - lowercase
    expect(v2.isInvitationCodeValid("p0FFF-ABCDE-H1JKL-02000")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-abcde-H1JKL-02000")).toBe(false);

    // code too short
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-0200")).toBe(false);
    expect(v2.isInvitationCodeValid("P0FFF-ABCDE-H1JKL-02")).toBe(false);
});

test("generate invitation code v2", () => {
    // test if the generated code is valid
    for (let i = 0; i < 10000; i++) {
        const code = v2.generateInvitationCode(4095, { nodeID: 0 });
        expect(v2.isInvitationCodeValid(code)).toBe(true);
    }

    // test if port can be correctly generated
    expect(v2.generateInvitationCode(4095, { nodeID: 0 }).startsWith("P0FFF")).toBe(true);
    expect(v2.generateInvitationCode(0, { nodeID: 0 }).startsWith("P0000")).toBe(true);
    expect(v2.generateInvitationCode(8080, { nodeID: 0 }).startsWith("P1F90")).toBe(true);
    expect(v2.generateInvitationCode(25565, { nodeID: 0 }).startsWith("P63DD")).toBe(true);

    // test if nodeID can be correctly generated
    expect(v2.parseInvitationCode(v2.generateInvitationCode(4095, { nodeID: 0 })).nodeID).toBe(0);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(4095, { nodeID: 1 })).nodeID).toBe(1);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(4095, { nodeID: 255 })).nodeID).toBe(255);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(4095, { nodeID: 4095 })).nodeID).toBe(4095);
    expect(() => v2.parseInvitationCode(v2.generateInvitationCode(4095, { nodeID: 40995 }))).toThrow();

    // test if attachment can be correctly included
    const codeWithAttachment = v2.generateInvitationCode(4095, {
        nodeID: 0,
        attachment: "-test_attachment"
    });
    expect(codeWithAttachment.endsWith("-test_attachment")).toBe(true);
    expect(v2.parseInvitationCode(codeWithAttachment).attachment).toEqual("-test_attachment");

    // test if invalid port throws error
    expect(() => v2.generateInvitationCode(-1, { nodeID: 0 })).toThrow();
    expect(() => v2.generateInvitationCode(65536, { nodeID: 0 })).toThrow();
    expect(() => v2.generateInvitationCode(1.5, { nodeID: 0 })).toThrow();
    expect(() => v2.generateInvitationCode(NaN, { nodeID: 0 })).toThrow();

    // test version number is always "02"
    for (let i = 0; i < 100; i++) {
        const code = v2.generateInvitationCode(8080, { nodeID: 0 });
        expect(code.slice(18, 20)).toBe("02");
    }

    // test that no I or O characters appear
    for (let i = 0; i < 1000; i++) {
        const code = v2.generateInvitationCode(8080, { nodeID: 0 });
        expect(code.slice(0, 22)).not.toContain("I");
        expect(code.slice(0, 22)).not.toContain("O");
        expect(code.slice(0, 22)).not.toContain("i");
        expect(code.slice(0, 22)).not.toContain("o");
    }
});

test("generate easytier arguments v2", () => {
    const code = v2.generateInvitationCode(4095, { nodeID: 0 });
    const codeData = v2.parseInvitationCode(code);

    // host
    const hostArgs = v2.generateEasyTierArguments({
        invitationCode: code,
        nodes: [
            "tcp://example.com:8080"
        ],
        role: "host",
        hostname: "Server-test"
    });

    expect(hostArgs).toEqual([
        "--encryption-algorithm=chacha20",
        "-p",
        "tcp://example.com:8080",
        `--network-name=${codeData.networkName}`,
        `--network-secret=${codeData.networkSecret}`,
        "-i",
        "10.114.114.114",
        "--hostname=Server-test",
        "--tcp-whitelist=4095",
        "--udp-whitelist=4095"
    ]);

    // client
    const clientArgs = v2.generateEasyTierArguments({
        invitationCode: code,
        nodes: [
            "tcp://example.com:8080"
        ],
        role: "client",
        hostnameSuffix: "-test",
        portToForward: 4444
    });

    expect(clientArgs).toEqual([
        "--encryption-algorithm=chacha20",
        "-p",
        "tcp://example.com:8080",
        `--network-name=${codeData.networkName}`,
        `--network-secret=${codeData.networkSecret}`,
        "--hostname=Client-test",
        "--port-forward=tcp://[::1]:4444/10.114.114.114:4095",
        "--port-forward=tcp://127.0.0.1:4444/10.114.114.114:4095",
        "--port-forward=udp://[::1]:4444/10.114.114.114:4095",
        "--port-forward=udp://127.0.0.1:4444/10.114.114.114:4095",
        "--tcp-whitelist=0",
        "--udp-whitelist=0",
        "-d"
    ]);

    // test with multiple nodes
    const multiNodeArgs = v2.generateEasyTierArguments({
        invitationCode: code,
        nodes: [
            "tcp://example1.com:8080",
            "tcp://example2.com:9090",
            "udp://example3.com:7070"
        ],
        role: "host",
        hostname: "Server-multinode"
    });

    expect(multiNodeArgs).toContain("-p");
    expect(multiNodeArgs).toContain("tcp://example1.com:8080");
    expect(multiNodeArgs).toContain("tcp://example2.com:9090");
    expect(multiNodeArgs).toContain("udp://example3.com:7070");

    // test with different port
    const code8080 = v2.generateInvitationCode(8080, { nodeID: 0 });
    const args8080 = v2.generateEasyTierArguments({
        invitationCode: code8080,
        nodes: [],
        role: "host",
        hostname: "Server-8080"
    });

    expect(args8080).toContain("--tcp-whitelist=8080");
    expect(args8080).toContain("--udp-whitelist=8080");
});

class MockResponse {
    /**
     *
     * @param { any } body
     * @param { {status?: number, statusText?: string} } init
     */
    constructor(body, init = {}) {
        this.body = body;
        this.status = init.status ?? 200;
        this.statusText = init.statusText ?? "OK";
    }

    async json() {
        return this.body;
    }

    async text() {
        return JSON.stringify(this.body);
    }
}

test("nodeID edge cases v2", () => {
    // test minimum nodeID
    const code0 = v2.generateInvitationCode(8080, { nodeID: 0 });
    expect(v2.parseInvitationCode(code0).nodeID).toBe(0);
    expect(code0).toContain("-02000");

    // test maximum nodeID (4095 = FFF in hex)
    const code4095 = v2.generateInvitationCode(8080, { nodeID: 4095 });
    expect(v2.parseInvitationCode(code4095).nodeID).toBe(4095);
    expect(code4095).toContain("-02FFF");

    // test various nodeIDs
    for (const nodeID of [0, 1, 10, 100, 255, 256, 1000, 4095]) {
        const code = v2.generateInvitationCode(8080, { nodeID });
        const parsed = v2.parseInvitationCode(code);
        expect(parsed.nodeID).toBe(nodeID);
    }
});

test("attachment parsing edge cases v2", () => {
    // empty attachment should be undefined
    const codeNoAttachment = v2.generateInvitationCode(8080, { nodeID: 0 });
    expect(v2.parseInvitationCode(codeNoAttachment).attachment).toBeUndefined();

    // attachment with special characters
    const specialAttachment = "-!@#$%^&*()_+={}[]|:;<>?,./";
    const codeSpecial = v2.generateInvitationCode(8080, {
        nodeID: 0,
        attachment: specialAttachment
    });
    // Note: attachment in v2 includes the version and nodeID part
    expect(v2.parseInvitationCode(codeSpecial).attachment).toContain(specialAttachment);

    // attachment with spaces
    const spaceAttachment = "-test with spaces";
    const codeSpace = v2.generateInvitationCode(8080, {
        nodeID: 0,
        attachment: spaceAttachment
    });
    expect(v2.parseInvitationCode(codeSpace).attachment).toContain(spaceAttachment);
});

test("port edge cases v2", () => {
    // test minimum port
    const code0 = v2.generateInvitationCode(0, { nodeID: 0 });
    expect(v2.parseInvitationCode(code0).port).toBe(0);

    // test maximum port
    const code65535 = v2.generateInvitationCode(65535, { nodeID: 0 });
    expect(v2.parseInvitationCode(code65535).port).toBe(65535);

    // test common ports
    expect(v2.parseInvitationCode(v2.generateInvitationCode(80, { nodeID: 0 })).port).toBe(80);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(443, { nodeID: 0 })).port).toBe(443);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(8080, { nodeID: 0 })).port).toBe(8080);
    expect(v2.parseInvitationCode(v2.generateInvitationCode(25565, { nodeID: 0 })).port).toBe(25565);
});

test("round-trip consistency v2", () => {
    // test that generate -> parse -> generate produces consistent results
    for (let i = 0; i < 100; i++) {
        const originalPort = Math.floor(Math.random() * 65536);
        const originalNodeID = Math.floor(Math.random() * 4096);
        const attachment = Math.random() > 0.5 ? "-test" : undefined;

        const code = v2.generateInvitationCode(originalPort, {
            nodeID: originalNodeID,
            attachment
        });
        const parsed = v2.parseInvitationCode(code);

        expect(parsed.port).toBe(originalPort);
        expect(parsed.nodeID).toBe(originalNodeID);

        // Generate new code with parsed data
        const code2 = v2.generateInvitationCode(parsed.port, {
            nodeID: parsed.nodeID,
            attachment: parsed.attachment
        });
        const parsed2 = v2.parseInvitationCode(code2);

        expect(parsed2.port).toBe(originalPort);
        expect(parsed2.nodeID).toBe(originalNodeID);
    }
});

// getNodePingMS has been moved to node.ts
// This test is now in node.test.js
