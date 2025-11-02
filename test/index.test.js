// @ts-check

const index = require("../dist/index");

test("parse invitation code", () => {
    // without attachment
    expect(index.parseInvitationCode("P0FFF-ABCDE-H1JKL")).toMatchObject({
        port: 4095,
        networkName: "P0FFF-ABCDE",
        networkSecret: "H1JKL",
        attachment: undefined
    });
    // with attachment
    expect(index.parseInvitationCode("P0FFF-ABCDE-H1JKL-attachment")).toMatchObject({
        port: 4095,
        networkName: "P0FFF-ABCDE",
        networkSecret: "H1JKL",
        attachment: "-attachment"
    });
    // throw if invalid port hex string
    expect(() => index.parseInvitationCode("PZZZZ-ABCDE-H1JKL")).toThrow();
    // throw if bad format
    expect(() => index.parseInvitationCode("Q0FFF-ABCDE-H1JKL")).toThrow();
    expect(() => index.parseInvitationCode("P0FFFFABCDE-H1JKL")).toThrow();
    expect(() => index.parseInvitationCode("P0FFF-ABCDEEH1JKL")).toThrow();
    // throw if lower case
    expect(() => index.parseInvitationCode("P0FFF-ABCDE_H1JKl")).toThrow();
    // throw if I or O found
    expect(() => index.parseInvitationCode("P0FFF-ABCDE-HIJKL")).toThrow();
    expect(() => index.parseInvitationCode("P0FFF-ABCDE-HOJKL")).toThrow();

    // check if it can correctly throw when invalid character is at the end to test if the code is fully checked
    expect(() => index.parseInvitationCode("P0FFF-ABCDE-H1JKO")).toThrow();
});

test("generate invitation code", () => {
    // test if the generated code is valid
    for (let i = 0; i < 10000; i++) {
        expect(index.isInvitationCodeValid(index.generateInvitationCode(4095)));
    }
    // test if port can be correctly generated
    expect(index.generateInvitationCode(4095).startsWith("P0FFF"));
    // test if attachment can be corrected included
    expect(index.parseInvitationCode(index.generateInvitationCode(4095, "-test_attachment")).attachment).toEqual("-test_attachment");
});

test("generate easytier arguments", () => {
    const code = index.generateInvitationCode(4095);
    const codeData = index.parseInvitationCode(code);
    // host
    expect(index.generateEasyTierArguments({
        invitationCode: code,
        nodes: [
            "tcp://example.com:8080"
        ],
        role: "host",
        hostname: "Server-test"
    })).toEqual([
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
    expect(index.generateEasyTierArguments({
        invitationCode: code,
        nodes: [
            "tcp://example.com:8080"
        ],
        role: "client",
        hostnameSuffix: "-test",
        portToForward: 4444
    })).toEqual([
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

test("fetch listed nodes", async () => {
    // test normal request
    (await index.getAvailableNodes()).forEach(node => expect(typeof node).toBe("string"));
    // mock failure
    const fetch = global.fetch;
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve(new MockResponse({
        success: false,
        error: "mocked",
        message: "mocked error"
    })));
    await index.getAvailableNodes().then(() => expect(false)).catch(() => { });
    // mock paging
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve(new MockResponse({
        success: true,
        data: {
            items: [{
                address: "tcp://example.com:8080"
            }],
            total_pages: 3
        }
    })));
    expect(await index.getAvailableNodes()).toEqual(Array(3).fill("tcp://example.com:8080"));
    global.fetch = fetch;
});