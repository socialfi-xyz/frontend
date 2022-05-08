import React, {useMemo, useState} from 'react'
import {Modal, Checkbox, Button, Input, message} from 'antd'
import './index.less'
import {ClientContract, multicallClient, multicallConfig} from "../../web3/multicall";
import {getContract, getWeb3, useActiveWeb3React} from "../../web3";
import {WOOF} from "../../web3/address";
import {fromWei, numToWei, toFormat} from "../../utils/format";
import CloseIcon from "../../assets/images/svg/close.svg";
import Web3 from "web3";
import {useDispatch, useSelector} from "react-redux";
import {TWITTER_USER_INFO_RELY} from "../../redux";

export function TransferModal({visible, onClose}) {
  const {chainId, library, account} = useActiveWeb3React()
  const [tokenValve, setTokenValve] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const {twitterUserInfo} = useSelector(state => state.index)
  const [transferLoading, setTransferLoading] = useState(false)
  const dispatch = useDispatch()

  const onTransfer = () => {
    if (Number(tokenValve) <= 0){
      message.warn('please enter amount')
      return
    }
    if (!Web3.utils.isAddress(toAddress)) {
      message.warn('no address')
      return;
    }
    setTransferLoading(true)
    const contract = getContract(library, WOOF.abi, WOOF.address)

    const tokenValve_ = numToWei(Number(tokenValve).toFixed(16), 18)
    contract.methods.transfer(toAddress, tokenValve_).send({
      from: account,
    }).on('transactionHash', hash => {
      setTransferLoading(false)
    })
      .on('receipt', (_, receipt) => {
        dispatch({
          type: TWITTER_USER_INFO_RELY
        })
        onClose()
      })
      .on('error', (err, receipt) => {
        setTransferLoading(false)
      })
  }

  const onMax = () => {
    setTokenValve(twitterUserInfo.unlockedOf)
    console.log(twitterUserInfo.unlockedOf)
  }

  return (
    <React.Fragment>
      <Modal
        title="Transfer"
        visible={visible}
        footer={null}
        onCancel={onClose}
        centered
        wrapClassName="transfer-modal-wrap"
        zIndex={1001}
        destroyOnClose
        closeIcon={<img src={CloseIcon} alt=""/>}
      >
        {

            <div className="transfer-modal-dialog">
              <div className="transfer-view">
                <p className="p-t">To</p>
                <div>
                  <div className="input-eth">
                    <Input type="text" value={toAddress} placeholder="0X000000" style={{ paddingRight: 0}} onInput={e => setToAddress(e.target.value)}/>
                  </div>
                </div>
              </div>
              <div className="transfer-view">
                <p className="p-t">Amount</p>
                <div>
                  <div className="input-eth">
                    <Input type="number" value={tokenValve} onInput={e => setTokenValve(e.target.value)} placeholder="1 WOOF"
                           onBlur={e => (e.target.value * 1) > twitterUserInfo.unlockedOf && onMax()}/>
                    <div className="input-menu">
                      {/*<span>TWTR</span>*/}
                      <Button size="small" onClick={onMax}>MAX</Button>
                    </div>
                  </div>
                </div>
                <p className="p-b">Available amount： {toFormat(twitterUserInfo.unlockedOf)} WOOF</p>
              </div>
              <div className="btn-submit">
                <Button type="primary" onClick={onTransfer} loading={transferLoading}>
                  Transfer
                </Button>
              </div>
            </div>
        }
      </Modal>
    </React.Fragment>
  )
}
