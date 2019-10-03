// for async/await
import 'regenerator-runtime/runtime'
import { formatDistanceStrict } from 'date-fns'

const APIs = {
  "endpoint": "https://plasma.dappchains.com/rpc",
  "status": "/status",
  "blockheight": "/blockchain?",
  "block": "/block?height=",
  "tx": "/tx?hash=",
}

const pageCnt = 10 - 1;
let bs = {}
let changeInput = document.querySelector('.js-updateLoop');
let isStop = false
const aFetch = async (url, options={})=>
  (await (await fetch(url, options)).json()).result

const getChainStatus = async ()=>
  await aFetch(`${APIs.endpoint}${APIs.status}`)
const getBlocks = async ({from, to})=>
  await aFetch(`${APIs.endpoint}${APIs.blockheight}minHeight=${from}&maxHeight=${to}`)
const onBlockClickHandler = async e => {
  const t = e.currentTarget
  const dataId = t.getAttribute('data-id')
  const block = await aFetch(`${APIs.endpoint}${APIs.block}${dataId}`)
  let txHash = block.block_meta.header.data_hash
  let tx = await aFetch(`${APIs.endpoint}${APIs.tx}0x${txHash}`)
  document.querySelector("#blockDetail .blockHeight").textContent = "#" + dataId
  if (!tx) {
    tx = {
      hash: "",
      tx_result: {
        info: "",
        data: "",
      }
    }
  }
  document.querySelector("#blockDetail .txDetail>.hash>.hash").textContent = tx.hash
  document.querySelector("#blockDetail .txDetail>.result>.info").textContent = tx.tx_result.info
  document.querySelector("#blockDetail .txDetail>.result>.data").textContent = tx.tx_result.data
  document.querySelector("#blockDetail").classList.remove("chosen")
  document.querySelector("#blockDetail").classList.add("chosen")
}

const getSinceFrom = since => formatDistanceStrict(Date.parse(since), new Date(), {includeSeconds:true})
const updateHashLists = ({blockMetas})=> {
  const list = document.querySelector("#blocks__meta")
  const lastBlockheightElement = document.querySelector("#blocks__meta>.row.hash.item")
  const lastBlockheight = lastBlockheightElement && lastBlockheightElement.getAttribute('data-id') || 0
  blockMetas = blockMetas.filter(o=>o.header.height>lastBlockheight)
  blockMetas.reverse().forEach(v=>{
    const node = document.querySelector("#blocks__meta .hash.obj").cloneNode({deep: true});
    node.classList.remove("obj")
    node.classList.add("item")
    node.setAttribute("data-id", v.header.height)
    node.querySelector('.head').textContent = "#"+v.header.height
    node.querySelector('.desc>.transaction>span').textContent = v.header.num_txs
    node.querySelector('.desc>.validator>.link').textContent = `loom${v.header.proposer_address}`
    const since = node.querySelector('.desc>.since')
    since.textContent = getSinceFrom(v.header.time)
    since.setAttribute('data-since', v.header.time)
    node.addEventListener("click", onBlockClickHandler)
    list.prepend(node)
  })
  document.querySelectorAll("#blocks__meta .item").forEach((o,k)=>{
    k>pageCnt && o.remove()
  })
}

const updateTime = ()=> {
  document.querySelectorAll("#blocks__meta .item").forEach((o,k)=>{
    const since = o.querySelector(".desc>.since")
    since.textContent = getSinceFrom(since.getAttribute('data-since'))
  })
}


changeInput.onchange = function() {
  let checked = document.querySelector('.js-updateLoop').checked
  if (!checked) {
    window.stopLoop();
  }
  else {
    window.startLoop();
  }
};

const updateLoop = async ()=> {
  bs.status = await getChainStatus()
  if (bs.status["sync_info"] && bs.status["sync_info"]["latest_block_height"] && !isStop) {
    let bh = +bs.status["sync_info"]["latest_block_height"]
    bs.blocks = await getBlocks({from: bh-pageCnt, to: +bh})
    updateHashLists({blockMetas: bs.blocks.block_metas})
    if (!isStop ) {
      nextLoop();
    }
  }
}
window.stopLoop=()=> {
  isStop = true
}
window.startLoop=()=> {
  isStop = false
  updateLoop()
}
window.nextLoop=()=>{
  setTimeout(updateLoop, 1000 )
}
const initApps = async ()=>{
  console.log(+(new Date()), "init Apps")
  setInterval(updateTime, 1000)
  updateLoop()
  document.body.addEventListener("click", ()=>{
    document.querySelector("#blockDetail").classList.remove("chosen")
  })
}
document.addEventListener('DOMContentLoaded', initApps);
