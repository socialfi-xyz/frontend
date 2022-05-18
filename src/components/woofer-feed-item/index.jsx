import React, {useMemo, useState} from 'react'
import {WooferFeedItemView} from "./style";
import {Tweet} from "react-twitter-widgets";
import Avatars from "../avatars";
import {CButton} from "../../theme/styleComponent";
import {useCountDown, useIsDarkMode} from "../../hooks";
import {getContract, useActiveWeb3React} from "../../web3";
import {ClientContract, multicallClient, multicallConfig} from "../../web3/multicall";
import {WOOF} from "../../web3/address";
import {useSelector} from "react-redux";
import {fromWei, keepDecimals, toFormat, tweetIdToHex} from "../../utils/format";
import LoadingIcon from '../../assets/images/svg/loading.svg'
import {UPDATE_WOOF_LIST} from "../../redux";

function CountDown({endTime}) {
  const {hours, minutes} = useCountDown(endTime)
  if (!endTime || endTime <= 0) {
    return <>{`- hours - minutes`}</>
  }
  return <>{`${hours} hours ${minutes} minutes`}</>
}

export default function WooferFeedItem({tweet, setShowWoofUserModalFn, onWoofBtn, reportItemsData}) {
  const {account, library} = useActiveWeb3React()
  const {updateCount, woofPrice, accountAirClaimed} = useSelector(state => state.index)
  const [tweetLoading, setTweetLoading] = useState(true)
  const [getRewardLoading, setRewardLoading] = useState(false)
  const {darkMode} = useIsDarkMode()
  const [accountData, setAccountData] = useState({
    cowoofAmt: '0',
    yieldPerToken: '0',
    yield_: '0',
    yieldPaid: '0',
    rewoofAmt: '0',
    rewardPerToken: '0',
    reward: '0',
    rewardPaid: '0',
    roi: '0',
    earned: '0'
  })
  const [contractStateData, setContractStateData] = useState({
    APY: '0',
    woofEndTime: '0',
  })

  const getContractStaticData = () => {
    const contract = new ClientContract(WOOF.abi, WOOF.address, multicallConfig.defaultChainId)
    const tweetId = tweetIdToHex(tweet.tweetId)
    const calls = [
      contract.woofEndTime(tweetId),
      contract.APY(tweetId),
    ]
    multicallClient(calls).then(res => {
      setContractStateData({
        woofEndTime: res[0],
        APY: fromWei(res[1], 18).toString()
      })
      reportItemsData({
        tweetId: tweet.tweetId,
        woofEndTime: res[0],
        APY: fromWei(res[1], 18).toString()
      })
    })
  }


  const getAccountData = () => {
    const contract = new ClientContract(WOOF.abi, WOOF.address, multicallConfig.defaultChainId)
    const tweetId = tweetIdToHex(tweet.tweetId)
    console.log(tweetId, account)
    const calls = [
      contract.woofDog(tweetId, account),
      contract.earned(tweetId, account),
      // contract.roi(tweetId, account),
    ]
    multicallClient(calls).then(res => {
      console.log(res)
      if (res[0] === null) {
        return
      }
      const [cowoofAmt, yieldPerToken, yield_, yieldPaid, rewoofAmt, rewardPerToken, reward, rewardPaid] = res[0]
      setAccountData({
        cowoofAmt: keepDecimals(fromWei(cowoofAmt, 10)),
        yieldPerToken: keepDecimals(fromWei(yieldPerToken, 10)),
        yield_: keepDecimals(fromWei(yield_, 10)),
        yieldPaid: keepDecimals(fromWei(yieldPaid, 10)),
        rewoofAmt: keepDecimals(fromWei(rewoofAmt, 10)),
        rewardPerToken: keepDecimals(fromWei(rewardPerToken, 10)),
        reward: keepDecimals(fromWei(reward, 10)),
        rewardPaid: keepDecimals(fromWei(rewardPaid, 10)),


        earned: keepDecimals(fromWei(res[1], 10)),
        // roi: keepDecimals(fromWei(res[2], 10)),
      })
    })
  }

  const calcWoofVal = (amount) => {
    return toFormat(keepDecimals(amount * woofPrice))
  }
  const getRewards = () => {
    setRewardLoading(true)
    const contract = getContract(library, WOOF.abi, WOOF.address)
    // tweetIdToHex(twitterUserInfo.twitterId),
    contract.methods.getReward(
      tweetIdToHex(tweet.tweetId),
    ).send({
      from: account,
    })
      .on('receipt', (_) => {
        setRewardLoading(false)
      })
      .on('error', () => {
        setRewardLoading(false)
      })
  }

  useMemo(() => {
    getContractStaticData()
  }, [updateCount])
  useMemo(() => {
    if (account && accountAirClaimed === 1) {
      getAccountData()
    }
  }, [updateCount, account, accountAirClaimed])

  useMemo(() => {
    setTweetLoading(true)
  }, [darkMode])
  return (
    <WooferFeedItemView>
      <div className="woofer-item">
        <div className="woofer-item-cv">
          <div className="woofer-item-cs">
            <div>
              {
                tweetLoading && <div className="tweet-loading">
                  <img src={LoadingIcon} alt=""/>
                </div>
              }
              <Tweet tweetId={tweet.tweetId} options={{
                backgroundColor: '#ccc',
                theme: darkMode ? 'dark' : 'light',
                hideThread: false,
              }}
                     renderError={_err => {
                       return <div className="tweet-loading tweet-load-error">Could not load tweet!</div>
                     }}
                     onLoad={() => {
                       setTweetLoading(false)
                     }}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="woofer-item-info">
            <div className="woofer-item-info-data">
              <div className="woofer-item-info-data-i">
                <span>Remaining Period</span>
                <span><CountDown endTime={contractStateData.woofEndTime}/></span>
              </div>
              <div className="woofer-item-info-data-i">
                <span>7-day Return</span>
                <span>{(contractStateData.APY * 100).toFixed(2) * 1}%</span>
              </div>
              <div className="woofer-item-info-data-i">
                <span>Rewards</span>
                <span> {toFormat(keepDecimals(tweet.reward))} WOOF (${calcWoofVal(tweet.reward)})</span>
              </div>
              <div className="woofer-item-info-data-i">
                <span>Rewoof TVL</span>
                <span>{toFormat(keepDecimals(tweet.rewoofAmount))} WOOF (${calcWoofVal(tweet.rewoofAmount)})</span>
              </div>
              <div className="woofer-item-info-data-i">
                <span>Rewoofers</span>
                <span>{tweet.rewoofs.length}</span>
              </div>
              {
                account && <>
                  {
                    accountData.rewoofAmt > 0 && (<div className="woofer-item-info-data-i">
                      <span>Your Rewoof Amount</span>
                      <span>{toFormat(accountData.rewoofAmt)} WOOF (${calcWoofVal(accountData.rewoofAmt)})</span>
                    </div>)
                  }
                  {/*<div className="woofer-item-info-data-i">*/}
                  {/*  <span>Your Woof Amount</span>*/}
                  {/*  <span></span>*/}
                  {/*</div>*/}
                  {
                    accountData.yield_ > 0 && (
                      <div className="woofer-item-info-data-i">
                        <span>Your Woof Rewards</span>
                        <span>{toFormat(accountData.yield_)} WOOF (${calcWoofVal(accountData.yield_)})</span>
                      </div>)
                  }
                  {
                    accountData.reward > 0 && (
                      <div className="woofer-item-info-data-i">
                        <span>Your Rewoof Rewards</span>
                        <span>{toFormat(accountData.reward)} WOOF (${calcWoofVal(accountData.reward)})</span>
                      </div>)
                  }
                </>
              }
              {
                account && <>
                  {
                    accountData.cowoofAmt > 0 && (
                      <div className="woofer-item-info-data-i">
                        <span>Your Co-woof Amount</span>
                        <span>{toFormat(accountData.cowoofAmt)} WOOF (${calcWoofVal(accountData.cowoofAmt)})</span>
                      </div>
                    )
                  }
                  {/*<div className="woofer-item-info-data-i">*/}
                  {/*  <span>Your Co-woof Rewards</span>*/}
                  {/*  <span></span>*/}
                  {/*</div>*/}
                </>
              }
            </div>
            <div className="woofer-item-partake">
              <div className="flex-center" onClick={() => setShowWoofUserModalFn('Woofer', [tweet])}>
                <Avatars list={[tweet]}/>
                <span>Woofer</span>
              </div>
              <div className="flex-center" onClick={() => setShowWoofUserModalFn('Co-woof', tweet.cowoofs)}>
                <Avatars list={tweet.cowoofs}/>
                <span><span>{tweet.cowoofs.length}</span> Co-woof</span>
              </div>
              <div className="flex-center" onClick={() => setShowWoofUserModalFn('Rewoof', tweet.rewoofs)}>
                <Avatars list={tweet.rewoofs}/>
                <span><span>{tweet.rewoofs.length}</span> Rewoof</span>
              </div>
            </div>
            {
              (account && accountAirClaimed === 1) && (
                <div className="actions-btn flex-center">
                  <CButton type="primary" ghost onClick={() => onWoofBtn('Co-woof', tweet)}>Co-woof</CButton>
                  <CButton type="primary" ghost onClick={() => onWoofBtn('Rewoof', tweet)}>Rewoof</CButton>
                  {
                    (accountData.reward > 0 || accountData.yield_ > 0) &&
                    <CButton type="primary" ghost onClick={getRewards} loading={getRewardLoading}>Receive
                      rewards</CButton>
                  }
                </div>
              )
            }
          </div>
        </div>
      </div>
    </WooferFeedItemView>
  )
}

