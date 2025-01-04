const { type, name } = $arguments
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 定义需要过滤的 tag 列表 (仍然用于完全匹配的标签)
const excludedTags = ["hk", "hk-auto", "tw", "tw-auto", "jp", "jp-auto", "sg", "sg-auto", "us", "us-auto"];

// 在添加到 config.outbounds 之前过滤 proxies (使用 startsWith 检查前缀)
proxies = proxies.filter(proxy => {
  return !excludedTags.includes(proxy.tag) &&
         !proxy.tag.startsWith("剩余流量：") &&
         !proxy.tag.startsWith("过期时间：");
});

config.outbounds.push(...proxies)

config.outbounds.map(i => {
  if (['select', 'auto'].includes(i.tag)) {
    // getTags 函数也使用 startsWith 进行过滤，作为额外的保障
    i.outbounds.push(...getTags(proxies).filter(tag => !tag.startsWith("剩余流量：") && !tag.startsWith("过期时间：")));
  }
})

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies)
    .map(p => p.tag)
    .filter(tag => !tag.startsWith("剩余流量：") && !tag.startsWith("过期时间："));
}
