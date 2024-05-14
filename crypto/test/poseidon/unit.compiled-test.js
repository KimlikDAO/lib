import { assertEq } from "../../../testing/assert";
import { P, poseidon } from "../../poseidon";

assertEq(P, 0x40000000000000000000000000000000224698fc094cf91b992d30ed00000001n);
assertEq(poseidon([]), 0x2fadbe2852044d028597455bc2abbd1bc873af205dfabb8a304600f3e09eeba8n);
assertEq(poseidon([1n]), 0x10b41a5d3139ef0802e5faf6a7776aab079e44e99ec5b306ddddd88e15fe9e6dn);
assertEq(poseidon([1n, 2n, 3n]), 0x366e46102b0976735ed1cc8820c7305822a448893fee8ceeb42a3012a4663fd0n);
assertEq(poseidon([1n, 2n, 3n, 4n]), 0x27cb98f251ab99b29c08e8509772dff6e6f9454293d55941b84f09a9c2f2169an);
assertEq(poseidon([1n, 2n, 3n, 4n, 5n]), 0x27cc8fc2d8052df2f44fee2d74ea01aa33195d263b99128f78f24ae0b420d7ecn);

assertEq(poseidon([123123123n]), 0xc2a3f435a718a6653343c3d6d0bde00e8278ed981cb0d2f16868f621032623an);
