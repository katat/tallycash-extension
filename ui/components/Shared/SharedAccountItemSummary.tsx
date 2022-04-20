import React, { ReactElement } from "react"

import { AccountTotal } from "@tallyho/tally-background/redux-slices/selectors"
import { addOrEditAddressName } from "@tallyho/tally-background/redux-slices/accounts"

import { useDispatch } from "react-redux"
import SharedLoadingSpinner from "./SharedLoadingSpinner"
import SharedIcon from "./SharedIcon"
import { SharedTypedInput } from "./SharedInput"

interface Props {
  isSelected?: boolean
  accountTotal: AccountTotal
  children?: React.ReactNode
}

export default function SharedAccountItemSummary(props: Props): ReactElement {
  const { isSelected, accountTotal, children } = props
  const {
    shortenedAddress,
    name,
    avatarURL,
    localizedTotalMainCurrencyAmount,
  } = accountTotal

  const dispatch = useDispatch()
  const [localName, setLocalName] = React.useState(name ?? "")
  const [editing, setEditing] = React.useState(false)

  React.useEffect(() => {
    setLocalName(name ?? "")
  }, [name])

  return (
    <li className="standard_width">
      <div className="summary">
        <div className="left">
          {isSelected ? (
            <div className="avatar_selected_outline">
              <div className="avatar" />
            </div>
          ) : (
            <div className="avatar" />
          )}

          <div className="info">
            <div className="address_name">
              {editing ? (
                <div role="presentation" onClick={(e) => e.stopPropagation()}>
                  <SharedTypedInput
                    label=""
                    parseAndValidate={(value) => {
                      return { parsed: value }
                    }}
                    onChange={(value) => {
                      if (typeof value === "string") {
                        setLocalName(value)
                      }
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === "Enter") {
                        dispatch(
                          addOrEditAddressName({
                            address: accountTotal.address,
                            name: localName,
                          })
                        )
                        setEditing(false)
                      }
                      if (e.key === "Escape") {
                        setEditing(false)
                        setLocalName(name ?? "")
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  {typeof name === "undefined" ? shortenedAddress : name}{" "}
                  <SharedIcon
                    icon="edit@2x.png"
                    color="var(--gold-80)"
                    width={12}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditing(true)
                    }}
                  />
                </>
              )}
            </div>
            <div className="address">
              {typeof name !== "undefined" ? shortenedAddress : ""}
            </div>
          </div>
        </div>
        <div className="right">
          <div className="balance_status">
            {typeof localizedTotalMainCurrencyAmount === "undefined" ? (
              <SharedLoadingSpinner size="small" />
            ) : (
              <div className="balance">
                <span className="lighter">$</span>
                {localizedTotalMainCurrencyAmount}
              </div>
            )}
            {isSelected ? (
              <div className="connected_status">Connected</div>
            ) : null}
          </div>
        </div>
      </div>

      {children}

      <style jsx>{`
        li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 auto;
          height: 52px;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 auto;
          flex-grow: 2;
          height: 52px;
        }
        .avatar {
          background: url("${avatarURL ?? "./images/avatar@2x.png"}") center
            no-repeat;
          background-color: var(--green-40);
          background-size: cover;
          width: 48px;
          height: 48px;
          border-radius: 12px;
        }
        .avatar_selected_outline {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 2px solid #22c480;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: -4px;
          margin-right: -4px;
        }
        .left {
          display: flex;
          align-items: center;
          padding-left: 4px;
        }
        .address_name {
          color: #fff;
          font-size: 18px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
        }
        .address {
          color: var(--green-40);
          font-size: 16px;
        }
        .balance {
          text-align: right;
          color: #fff;
          font-size: 16px;
        }
        .connected_status {
          color: #22c480;
          font-size: 18px;
          font-weight: 600;
          line-height: 24px;
          text-align: right;
        }
        .info {
          margin-left: 16px;
        }
        .lighter {
          color: var(--green-40);
        }
        .right {
          display: flex;
          align-items: center;
          padding-right: 4px;
        }
      `}</style>
    </li>
  )
}

SharedAccountItemSummary.defaultProps = {
  isSelected: false,
}
