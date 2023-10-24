import React from 'react'

import { BigNumber } from 'bignumber.js'
import classNames from 'classnames'
import { useTranslation } from 'gatsby-plugin-react-i18next'
import { Intent } from '../utils/vega/Intent'
import {
  addDecimalsFormatNumber,
  formatNumberPercentage,
} from '../utils/vega/number'
import { Tooltip } from './Tooltip'
import { Indicator } from './IntentInidcator'

const Remainder = () => (
  <div className="bg-greys-light-200 relative h-[inherit] flex-1" />
)

const getIntentBackground = (intent?: Intent) => {
  return {
    'bg-neutral-200 dark:bg-neutral-800': intent === undefined,
    'bg-black dark:bg-white': intent === Intent.None,
    'bg-vega-blue-300 dark:bg-vega-blue-650': intent === Intent.Primary,
    'bg-danger': intent === Intent.Danger,
    'bg-warning': intent === Intent.Warning,
    // contrast issues with light mode
    'bg-vega-green-550 dark:bg-vega-green': intent === Intent.Success,
  }
}
const Target = ({
  target,
  decimals,
  isLarge,
}: {
  isLarge: boolean
  target: string
  decimals: number
}) => {
  const { t } = useTranslation('component.healthbar')

  return (
    <Tooltip
      description={
        <div className="text-vega-dark-100 dark:text-vega-light-200">
          <div className="mt-1.5 inline-flex">
            <Indicator variant={Intent.None} />
          </div>
          <span>
            {t('Target stake')} {addDecimalsFormatNumber(target, decimals)}
          </span>
        </div>
      }
    >
      <div
        className={classNames(
          'group absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-1/2 px-1.5'
        )}
        style={{ left: '50%' }}
      >
        <div
          className={classNames(
            'health-target group-hover:scale-y-108 w-0.5 bg-vega-dark-100 group-hover:scale-x-150 dark:bg-vega-light-100',
            {
              'h-6': !isLarge,
              'h-12': isLarge,
            }
          )}
        />
      </div>
    </Tooltip>
  )
}

const AuctionTarget = ({
  trigger,
  isLarge,
  rangeLimit,
  decimals,
}: {
  isLarge: boolean
  trigger: number
  rangeLimit: number
  decimals: number
}) => {
  const { t } = useTranslation('component.healthbar')
  const leftPosition = new BigNumber(trigger).div(rangeLimit).multipliedBy(100)
  return (
    <Tooltip
      description={
        <div className="text-vega-dark-100 dark:text-vega-light-200">
          <div className="mt-1.5 inline-flex">
            <Indicator variant={Intent.None} />
          </div>
          <span>
            {t('Auction Trigger stake')}{' '}
            {addDecimalsFormatNumber(trigger, decimals)}
          </span>
        </div>
      }
    >
      <div
        className={classNames(
          'group absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-1/2 px-1.5'
        )}
        style={{
          left: `${leftPosition}%`,
        }}
      >
        <div
          className={classNames(
            'health-target group-hover:scale-y-108 w-0.5 dashed-background group-hover:scale-x-150',
            {
              'h-6': !isLarge,
              'h-12': isLarge,
            }
          )}
        />
      </div>
    </Tooltip>
  )
}

const Level = ({
  commitmentAmount,
  rangeLimit,
  opacity,
  fee,
  prevLevel,
  decimals,
  intent,
}: {
  commitmentAmount: number
  rangeLimit: number
  opacity: number
  fee: string
  prevLevel: number
  decimals: number
  intent: Intent
}) => {
  const { t } = useTranslation('component.healthbar')
  const width = new BigNumber(commitmentAmount)
    .div(rangeLimit)
    .multipliedBy(100)
    .toNumber()

  const formattedFee = fee
    ? formatNumberPercentage(new BigNumber(fee).times(100), 2)
    : '-'

  const tooltipContent = (
    <div className="text-vega-dark-100 dark:text-vega-light-200">
      <div className="mt-1.5 inline-flex">
        <Indicator variant={intent} />
      </div>
      <span>
        {formattedFee} {t('Fee')}
      </span>
      <div className="flex  flex-col">
        <span>
          {prevLevel ? addDecimalsFormatNumber(prevLevel, decimals) : '0'} -{' '}
          {addDecimalsFormatNumber(commitmentAmount, decimals)}
        </span>
      </div>
    </div>
  )

  return (
    <Tooltip description={tooltipContent}>
      <div
        className={classNames(`group relative h-[inherit] w-full min-w-[1px]`)}
        style={{
          width: `${width}%`,
        }}
      >
        <div
          className={classNames(
            'relative h-[inherit] w-full group-hover:scale-y-150',
            getIntentBackground(intent)
          )}
          style={{ opacity }}
        />
      </div>
    </Tooltip>
  )
}

const Full = () => (
  <div className="absolute bottom-0 left-0 h-[inherit] w-full bg-transparent" />
)

interface Levels {
  fee: string
  commitmentAmount: number
}

export const HealthBar = ({
  target = '0',
  decimals,
  levels,
  size = 'small',
  intent,
  triggerRatio,
}: {
  target: string
  decimals: number
  levels: Levels[]
  size?: 'small' | 'large'
  intent: Intent
  triggerRatio?: string
}) => {
  const { t } = useTranslation('component.healthbar')
  const targetNumber = parseInt(target, 10)
  const rangeLimit = targetNumber * 2

  const triggerRatioNumber = triggerRatio ? parseFloat(triggerRatio) : 0
  const auctionTrigger = targetNumber * triggerRatioNumber

  let lastVisibleLevel = 0
  const committedNumber = levels
    .reduce((total, current, index) => {
      const newTotal = total.plus(current.commitmentAmount)
      if (total.isLessThan(rangeLimit) && newTotal.isGreaterThan(rangeLimit)) {
        lastVisibleLevel = index
      }
      return newTotal
    }, new BigNumber(0))
    .toNumber()

  const isLarge = size === 'large'
  const showRemainder = committedNumber < rangeLimit || levels.length === 0
  const showOverflow = !showRemainder && lastVisibleLevel < levels.length - 1

  return (
    <div className="w-full">
      <div
        className={classNames('health-wrapper relative', {
          'py-2': !isLarge,
          'py-5': isLarge,
        })}
      >
        <div
          className={classNames('health-inner relative flex w-full', {
            'h-4': !isLarge,
            'h-8': isLarge,
          })}
        >
          <Full />

          <div
            className="health-bars flex h-[inherit] w-full
              gap-0.5 outline outline-vega-light-200 dark:outline-vega-dark-200"
          >
            {levels.map((p, index) => {
              const { commitmentAmount, fee } = p
              const prevLevel = levels[index - 1]?.commitmentAmount
              const opacity = 1 - 0.2 * index
              return index <= lastVisibleLevel ? (
                <Level
                  commitmentAmount={commitmentAmount}
                  rangeLimit={rangeLimit}
                  opacity={opacity}
                  fee={fee}
                  prevLevel={prevLevel}
                  decimals={decimals}
                  intent={intent}
                  key={'healthbar-segment-' + index}
                />
              ) : null
            })}
            {showRemainder && <Remainder />}
            {showOverflow && (
              <Tooltip
                description={
                  <div className="text-vega-dark-100 dark:text-vega-light-200">
                    {t('Providers greater than 2x target stake not shown')}
                  </div>
                }
              >
                <div className="relative h-[inherit] flex-1 leading-4">...</div>
              </Tooltip>
            )}
          </div>
        </div>
        {triggerRatio && (
          <AuctionTarget
            isLarge={isLarge}
            trigger={auctionTrigger}
            rangeLimit={rangeLimit}
            decimals={decimals}
          />
        )}

        <Target isLarge={isLarge} target={target} decimals={decimals} />
      </div>
    </div>
  )
}
