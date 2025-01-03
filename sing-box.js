const { type, name } = $arguments
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 定义需要过滤的 tag 列表
const excludedTags = ["hk", "hk-auto", "tw", "tw-auto", "jp", "jp-auto", "sg", "sg-auto", "us", "us-auto", "all", "all-auto"];

config.outbounds.push(...proxies)
config.outbounds.map(i => {
  if (['select', 'auto'].includes(i.tag)) {
    // 过滤掉 excludedTags 中的 tag
    i.outbounds.push(...getTags(proxies).filter(tag => !excludedTags.includes(tag)));
  }
})
$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
