// for async/await
import 'regenerator-runtime/runtime'
import { formatDistance } from 'date-fns'

const cmds = {
  "endpoint": "https://plasma.dappchains.com/rpc",
  "status": "/status",
  "blockheight": "/blockchain?",
  "block": "/block?height=",
  "tx": "/tx?hash=", //0x675F059C43118C88A5CB5086A60ECC40DEFA2C7C874CD49AFD95E98F6823C596
}

let bs = {}

const afetch = async (url, options={})=>
  (await (await fetch(url, options)).json()).result

const getChainStatus = async ()=>
  await afetch(`${cmds.endpoint}${cmds.status}`)
const getBlocks = async ({from, to})=>
  await afetch(`${cmds.endpoint}${cmds.blockheight}minHeight=${from}&maxHeight=${to}`)
const onBlockClickHandler = async e => {
  const t = e.currentTarget
  const dataId = t.getAttribute('data-id')
  const block = await afetch(`${cmds.endpoint}${cmds.block}${dataId}`)
  let txHash = block.block_meta.header.data_hash
  console.log("TxHash", txHash)
  const tx = await afetch(`${cmds.endpoint}${cmds.tx}0x${txHash}`)
  console.log("tx", tx)
  document.querySelector("#blockDetail").textContent = JSON.stringify(block, null, 2)
}

const getSinceFrom = since => formatDistance(Date.parse(since), new Date())
const updateHashLists = ({blockMetas})=> {
  const list = document.querySelector("#blockMeta")
  document.querySelectorAll("#blockMeta .item").forEach(o=>o.remove())
  blockMetas.forEach(v=>{
    const node = document.querySelector("#blockMeta .hash.obj").cloneNode({deep: true});
    node.classList.remove("obj")
    node.classList.add("item")
    node.setAttribute("data-id", v.header.height)
    node.querySelector('.head').textContent = v.header.height
    node.querySelector('.desc>.validator>.link').textContent = `loom${v.header.proposer_address}`
    const since = node.querySelector('.desc>.since')
    since.textContent = getSinceFrom(v.header.time)
    since.setAttribute('data-since', getSinceFrom(v.header.time))
    node.addEventListener("click", onBlockClickHandler)
    list.append(node)
  })
}
const initApps = async ()=>{
  console.log(+(new Date()), "init Apps", )
  let handle = setInterval(async ()=>{
    bs.status = await getChainStatus()
    console.log("block status updated", bs)
    if (bs.status["sync_info"] && bs.status["sync_info"]["latest_block_height"]) {
        let bh = +bs.status["sync_info"]["latest_block_height"]
        bs.blocks = await getBlocks({from: bh-9, to: +bh})
        updateHashLists({blockMetas: bs.blocks.block_metas})
    }
  }, 1000)
}

document.addEventListener('DOMContentLoaded', initApps);
