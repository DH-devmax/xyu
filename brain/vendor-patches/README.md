# Harness vendor patches

`sdk-native-launch.patch` is the only product patch carried on top of the pinned
DeepSeek Harness subtree. It exports the SDK's existing generic process factory
and process launch type; it does not modify the JSON-RPC protocol or runtime
behavior. The gateway needs this seam to launch either the native DSH executable
or the packaged macOS Intel Node carrier.

After every subtree update, run `scripts/update-deepseek-harness.sh <tag>` and
the complete brain contract/profile test suite. If upstream exposes the same API,
remove this patch and its application step in one reviewed commit.
