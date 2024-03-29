import React, { useState, useEffect, useRef } from "react";
import { useStoreContext } from "../../../contexts/Store";
import { get, shuffle } from "lodash";
import { BigNumber, toDecimals, weiDecimals } from "../../../utils";
import history from "../../../utils/history";
import { Link } from "react-router-dom";
import ms from "ms";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ProfileImage from "../../ProfileImage";
import StatusDot from "../StatusDot";
import HoldersProfiles from "../HoldersProfiles";
import { Row, Col } from "react-bootstrap";
import * as linkify from "linkifyjs";
import Linkify from "linkifyjs/react";
import YouTube from "react-youtube";
import { TwitterTweetEmbed } from "react-twitter-embed";
import Meme from "../../Meme";
import memeTypes from "../memeTypes";
import clickHandler from "../../../utils/clickHandler";

import "./style.scss";

const nodeURL = require("url");

const lineBreakRegExp = /(\r\n|\r|\n)/;

// function CharReveal({ encrypted, decrypted, length, reveal }) {
//   const [step, setStep] = useState(-1);

//   const [shuffled] = useState(shuffle([...Array(length).keys()]));
//   const [randStart] = useState(Math.floor(Math.random() * 100));
//   if (decrypted === "priv2")
//     console.log(step, length, shuffled, shuffled.length);
//   useEffect(() => {
//     if (decrypted === "priv2") console.log("effect");
//     if (!reveal) return;
//     if (step >= shuffled.length) return;
//     if (step === -1) {
//       setTimeout(setStep, randStart, step + 1);
//       return;
//     }
//     setTimeout(setStep, 10, step + 1);
//     return;
//   }, [reveal, step]);
//   // if (decrypted !== 'priv2') return null
//   const encLength = encrypted.length;
//   const message = [];

//   return decrypted
//     .split("")
//     .map((char, i) => {
//       const j = i % encLength;
//       console.log(char, i);
//       if (/\s/.test(char)) {
//         console.log("found space");
//         return char;
//       }
//       console.log("current step", step);
//       if (step === -1) return encrypted[j];
//       for (let s = 0; s < step + 1; s++) {
//         console.log(
//           shuffled[s] === i,
//           shuffled,
//           s,
//           shuffled[s],
//           i,
//           decrypted[i]
//         );
//         if (shuffled[s] === i) return decrypted[i];
//       }
//       return encrypted[j];
//     })
//     .join("");
//   //

//   // const [intervalId, setIntervalId] = useState()

//   // const nextStepTimeout = 0
//   // useEffect( () => {
//   //   if (!reveal) return
//   //   if (step >= 2) return
//   //   if (step === 0) {
//   //     setTimeout(setStep,randStart,step+1)
//   //     return
//   //   }
//   //   setTimeout(setStep,nextStepTimeout,step+1)
//   //   return
//   // },[reveal, step])
//   // return (
//   //   <span className={`char-reveal step-${step}`}>
//   //     <span className='decrypted'>{decrypted}</span>
//   //     <span className='encrypted'>{encrypted}</span>
//   //   </span>
//   // )
// }

function DecodeThreshold({ name, token, message, isSignedIn, actions }) {
  /* 4 states
   - Not signed in
   - Signed in, not staking
   - Signed in, staking (not able to decode)
   - Signed in, able to decode
  */
  const [decoding, setDecoding] = useState(false);

  if (!isSignedIn)
    return (
      <span>
        hold{" "}
        <span>
          <span className="amount-underline">
            {toDecimals(message.threshold, 3, 0)}
          </span>{" "}
          ${name}{" "}
        </span>
        to decode
      </span>
    );

  const { decodable, thresholdDiff } = message;
  const { myStake, isStaking } = token;
  let timeToDecode = null;
  const diff =
    !decodable && thresholdDiff != null ? BigNumber(thresholdDiff) : null; // metadata hasnt loaded yet

  async function decodeMessage(id) {
    setDecoding(true);
    const resp = await actions.decodeMessage(id);
    setDecoding(false);
  }
  // NOT DECODABLE
  if (!decodable) {
    // STAKING
    if (diff == null) return null; // metadata hasnt loaded yet

    if (isStaking) {
      const divisor = BigNumber(myStake)
        .div(token.totalStakes)
        .times(0.9)
        .times(0.00021)
        .times(5)
        .times(weiDecimals);

      const blocks = diff
        .div(divisor)
        .dp(0, 0)
        .toNumber();
      timeToDecode = <span className="time-to-decode">{ms(blocks * 15000 * 5)} left</span>;

      return (
        <span>
          you need
          {" "}
          <span className="amount-underline">{toDecimals(diff, 3, 0)}</span>{" "}more ${name} {timeToDecode}
        </span>
      );
    } else {
      // NOT STAKING
      const total = BigNumber("10").times(weiDecimals);
      const divisor = total
        .div(BigNumber(token.totalStakes || "1").plus(total))
        .times(0.9)
        .times(0.00021)
        .times(5)
        .times(weiDecimals);

      const blocks = diff
        .div(divisor)
        .dp(0, 0)
        .toNumber();
      timeToDecode = <span className="time-to-decode">about {ms(blocks * 15000 * 5)}</span>;

      return (
        <span className='hold-to-see'>
          hold{" "}
          <span>
            <span className="reveal-amount">
              {toDecimals(message.threshold, 3, 0)}
            </span>{" "}
            <span className='reveal-name'>
              ${name}
            </span>
          </span>{" "}
          to see {timeToDecode}
        </span>
      );
    }
  }

  if (decoding)
    return (
      <span>
        <i className="fas fa-exclamation"></i> decoding...
      </span>
    );

  if (decodable)
    return (
      <span>
        <span>you have enough&nbsp;</span>
        <span className="token-name">{name}</span>
        <span>&nbsp;to&nbsp;</span>
        <a
          className="decode-button badge badge-success"
          href="#"
          onClick={clickHandler(decodeMessage, message.id)}
        >
          decode
        </a>
      </span>
    );
}

// function EncryptedMessage({ encrypted, decrypted }) {
//   if (encrypted === decrypted) return encrypted;
//   const encLengh = encrypted.length;
//   return decrypted
//     .slice(0, 240)
//     .split("")
//     .map((char, i) => {
//       const j = i % encLengh;
//       if (/\s/.test(char) || i % 15 === 0) return " ";
//       return encrypted[j];
//     })
//     .join("");
// }

function DecryptMessage({ children }) {
  let delay = 1000;
  const [reveal, setReveal] = useState(false);
  const gifs = [
    "https://media.giphy.com/media/wcjtdRkYDK0sU/giphy.gif",
    "https://media.giphy.com/media/VGuAZNdkPUpEY/giphy.gif",
    "https://media.giphy.com/media/l3q2LuW8lGMfSMKlO/200w_d.gif",
    "https://media.giphy.com/media/4T1NFafropdQOrBYw6/200w_d.gif",
    "https://media.giphy.com/media/olN2N0iROsYow/giphy-downsized.gif"
  ];
  const [gifIndex] = useState(Math.floor(Math.random() * gifs.length));
  useEffect(() => {
    setTimeout(setReveal, delay, true);
    return;
  }, []);
  if (!reveal) return <img className="decoding" src={gifs[gifIndex]} />;
  return children;
}

function HiddenMessage({ message }) {
  return (
    <div className="fake-hidden-message">
      <div className="rectangle r1"></div>
      <div className="rectangle r2"></div>
      <div className="rectangle r3"></div>
    </div>
  );
}

function MessageIcon({ message }) {
  switch (message.type.replace(/:.*/, "")) {
    case "image":
      return <i className={"fas fa-image"} />;
    case "imgur":
      return <i className={"fas fa-image"} />;
    case "video":
      return <i className={"fas fa-video"} />;
    case "youtube":
      return <i className={"fab fa-youtube"} />;
    case "twitter":
      return <i className={"fab fa-twitter"} />;
    case "gift":
      return <i className={"fas fa-gift"} />;
    case "meme":
      return <i className="far fa-comment-alt"></i>;
    case "link":
      return <i className="fas fa-link"></i>;
    default:
      return <i className={"fas fa-align-left"} />;
  }
}

function VisibleMessageImage({ message }) {
  return (
    <img src={message.link} style={{ width: "100%", maxWidth: "450px" }} />
  );
}

function VisibleMessageYoutube({ message }) {
  const matches = message.link.match(
    /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/
  );
  const videoId = matches[matches.length - 1];
  return (
    <div style={{ width: "100%", maxWidth: "450px" }}>
      <YouTube videoId={videoId} />
    </div>
  );
}

function VisibleMessageTwitter({ message }) {
  const tweetId = nodeURL.parse(message.link).pathname.split("/")[3];

  return <TwitterTweetEmbed tweetId={tweetId} />;
}

function VisibleMessageVideo({ message }) {
  let videourl = message.link.replace(".gifv", ".mp4");
  return (
    <video controls loop="true" autoplay="true" muted="true">
      <source src={videourl} />
      Your browser does not support video
    </video>
  );
}

function VisibleMessage({ message }) {
  let messageComponent = null;

  switch (message.type) {
    case "image":
      messageComponent = <VisibleMessageImage message={message} />;
      break;
    case "youtube":
      messageComponent = <VisibleMessageYoutube message={message} />;
      break;
    case "twitter":
      messageComponent = <VisibleMessageTwitter message={message} />;
      break;
    case "video":
      messageComponent = <VisibleMessageVideo message={message} />;
      break;
    case "imgur":
      messageComponent = <VisibleMessageVideo message={message} />;
      break;
    default:
      const processed = message.message
        .split(lineBreakRegExp)
        .map(c => (lineBreakRegExp.test(c) ? <br /> : c));
      messageComponent = <Linkify>{processed}</Linkify>;
      break;
  }
  if (!message.decoded) return messageComponent;
  return <DecryptMessage>{messageComponent}</DecryptMessage>;
}

function MemeMessageBody({ message, decodeThreshold }) {
  const memeKey = message.type.replace("meme:", "");
  const memeData = memeTypes.find(data => data.key === memeKey) || {
    url: "https://sitechecker.pro/wp-content/uploads/2017/12/404.png"
  };
  let messageComponent = null;
  if (message.hidden) {
    messageComponent = (
      <Meme
        toptext={message.hint}
        bottomtext={message.id
          .replace(/-/g, "")
          .toUpperCase()
          .slice(0, 20)}
        url={memeData.url}
      />
    );
  } else {
    messageComponent = (
      <Meme
        toptext={message.hint}
        bottomtext={message.message}
        url={memeData.url}
      />
    );
    if (message.decoded)
      messageComponent = <DecryptMessage>{messageComponent}</DecryptMessage>;
  }
  return (
    <React.Fragment>
      <Col md="1" className="content-type-hint">
        <MessageIcon message={message} />
      </Col>
      <Col md="9 ml-2">
        <div className="message-target">{messageComponent}</div>
        {decodeThreshold}
      </Col>
    </React.Fragment>
  );
}

function CommentBubble({ message, canComment, onClick = () => {} }) {
  const count = message.childCount || 0;
  const [prevCount] = useState(count);
  const classNames = ["badge", "badge-light", "comment-bubble"];
  if (prevCount !== count) classNames.push("comment-count-changed");
  return (
    <span className={classNames.join(" ")} onClick={onClick}>
      <i className="fas fa-comment" style={{ fontSize: "1 rem" }}></i>{" "}
      <div style={{ fontWeight: "400" }}>
        <span style={{ fontWeight: "bold" }}>{message.childCount || 0}</span>{" "}
        comment{message.childCount > 1 || message.childCount === 0 ? `s` : ``}
      </div>
    </span>
  );
}

function ago(past) {
  let elapsed = Date.now() - past;
  elapsed = Math.floor(elapsed / 1000) * 1000;
  if (elapsed === 0) return "now";
  return ms(elapsed);
}

export default function MessageCard({
  message,
  myToken,
  token,
  isSignedIn,
  actions,
  canCopyUrl = true,
  canLinkToProfile = true,
  canComment = true,
  showFooter = true,
  canDestroy = true,
  onClickComment,
  onClickMessageCard
}) {
  const [destroyCountDown, setDestroyCountDown] = useState(null);

  if (!onClickComment) {
    onClickComment = clickHandler(() =>
      history.push(`/$${token.name}/${message.shortid}`)
    );
  }

  if (!onClickMessageCard) {
    onClickMessageCard = onClickComment;
  }

  function destroyMessage() {
    if (destroyCountDown == null) return setDestroyCountDown(3);
    setDestroyCountDown(null);
  }

  useEffect(() => {
    if (destroyCountDown == null) return;
    const id =
      destroyCountDown > 0
        ? setTimeout(setDestroyCountDown, 1000, destroyCountDown - 1)
        : setTimeout(actions.destroy, 1000, message);
    return () => clearTimeout(id);
  }, [destroyCountDown]);

  if (!message.id) return;

  let destroyIcon = null;
  if (myToken && message.tokenid === myToken.id && canDestroy) {
    destroyIcon = (
      <a
        href="#"
        onClick={clickHandler(destroyMessage)}
        className="message-delete"
      >
        {destroyCountDown == null ? (
          <i className="fas fa-times"></i>
        ) : destroyCountDown <= 0 ? (
          <i className="fas fa-circle destroying"></i>
        ) : (
          <span>
            {destroyCountDown}{" "}
            <span className="small text-muted">(cancel)</span>
          </span>
        )}
      </a>
    );
  }

  const messageUrl = `/$${token.name}/${message.shortid || message.id}`;

  function decodeTweetText() {
    return `🔑 ${actionWordFuture} in @2100hq`;
    // if (!message.recipientcount){
    //   return "🔑 Be the first to decode in @2100hq"
    // } else {
    //   return `🔑 ${message.recipientcount} other${message.recipientcount > 0 ? 's' : ''} has decoded in @2100hq`
    // }
  }

  function postTweet() {
    const encrypted = message.id
      .replace(/-/g, "")
      .toUpperCase()
      .slice(0, 20);
    const text = [];
    if (message.hint) {
      text.push(`🗨️ ${message.hint}`);
    } else {
      text.push(decodeTweetText());
    }
    text.push(`🔒 ${encrypted}`);

    if (message.hint) {
      text.push(`\n${decodeTweetText()}`);
    }
    text.push(window.location.origin + messageUrl);

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text.join("\n")
      )}`,
      null,
      "width=500,height=400"
    );
  }
  const actionWordPast = message.type === "gift" ? "redeemed" : "decoded";
  const actionWordFuture = message.type === "gift" ? "redeem" : "decode";

  const messageComponent = message.hidden ? (
    <HiddenMessage message={message} key={"hidden" + message.id} />
  ) : (
    <VisibleMessage message={message} key={"visible" + message.id} />
  );

  const decodeThreshold = message.hidden ? (
    <div className="hidden-text enough-to-decode">
      <DecodeThreshold
        name={token.name}
        token={token}
        message={message}
        isSignedIn={isSignedIn}
        actions={actions}
      />
    </div>
  ) : null;

  const classNames = [
    "message-card",
    `message-type-${message.type.replace(/:.*/, "")}`
  ];
  if (destroyCountDown != null) classNames.push("message-destroy-countdown");
  if (message.hidden) classNames.push("message-hidden");

  return (
    <div className={classNames.join(" ") + " clearfix"} key={message.id}>
      {destroyIcon}
      <div style={{ width: "10%", float: "left", textAlign: "center" }} className="main-photo">
        <a
          href="#"
          onClick={clickHandler(() => history.push(`/$${token.name}`))}
        >
          <ProfileImage token={token} />
        </a>

        <span className="message-time">{ago(message.created) + ` ago`}</span>
        <a
          href="#"
          className="small message-share"
          onClick={clickHandler(postTweet)}
        >
          <i className="fab fa-twitter"></i>
        </a>
      </div>
      <div className="message-content" style={{ width: "90%", float: "right" }}>
        <Row className="no-gutters message-header">
          <Col style={{ marginLeft: "1.2rem" }}>
            {message.hint && (
              <div>
                <span className="message-hint" onClick={onClickMessageCard}>
                  <Linkify>{message.hint}</Linkify>
                </span>
              </div>
            )}
          </Col>
        </Row>
        <Row className="no-gutters message-body">
          <Col style={{ marginLeft: "1.2rem" }}>
            {messageComponent}
            {decodeThreshold}
          </Col>
        </Row>
        <Row
          className="no-gutters message-footer"
          style={{ display: showFooter ? "auto" : "none" }}
        >
          <Col style={{ marginLeft: "1.2rem" }}>
            <span className="badge badge-light">
              <HoldersProfiles
                prefix=""
                suffix="staking"
                holders={Object.entries(token.stakes || {})
                  .filter(
                    ([address]) => !(message.recipients || []).includes(address)
                  )
                  .filter(([address, amount]) => amount !== 0 && amount !== "0")
                  .map(([address]) => address)}
              />
            </span>
            <span className="badge badge-light">
              <HoldersProfiles
                prefix=""
                suffix="decoded"
                holders={message.recipients || message.recipientcount}
              />
            </span>
            <CommentBubble
              message={message}
              canComment={canComment}
              onClick={onClickComment}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
