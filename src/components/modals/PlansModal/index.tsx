import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';
import AppButton from 'src/components/AppButton';
import AppText from 'src/components/AppText';
import StorageUsageBar from 'src/components/StorageUsageBar';
import storageService from 'src/services/StorageService';
import { useAppSelector } from 'src/store/hooks';
import { storageSelectors } from 'src/store/slices/storage';
import { useTailwind } from 'tailwind-rn';
import FileIcon from '../../../../assets/icons/file-icon.svg';
import strings from '../../../../assets/lang/strings';
import { BaseModalProps } from '../../../types/ui';
import BottomModal from '../BottomModal';

import errorService from '@internxt-mobile/services/ErrorService';
import { notifications } from '@internxt-mobile/services/NotificationsService';
import prettysize from 'prettysize';
import paymentService from 'src/services/PaymentService';
import { getLineHeight } from 'src/styles/global';
import { constants } from '../../../services/AppService';

const TB_5_IN_BYTES = 5497558138880;
const TRIAL_CODE = constants.PC_CLOUD_TRIAL_CODE;

const PlansModal = (props: BaseModalProps) => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const tailwind = useTailwind();
  const { subscription } = useAppSelector((state) => state.payments);
  const { limit } = useAppSelector((state) => state.storage);
  const usage = useAppSelector(storageSelectors.usage);

  const isUpgrading = subscription.type === 'free';
  const hasSubscription = subscription.type !== 'free';
  const isAlreadyOn5TBPlan = limit === TB_5_IN_BYTES;
  const hasStorageOverlflow = usage > TB_5_IN_BYTES;

  const getPlanUpgradeTitle = () => {
    if (isUpgrading) {
      return strings.modals.Plans.title;
    }
    if (hasSubscription) {
      return strings.modals.Plans.changePlan.title;
    }
  };

  const getPlanUpgradeSubtitle = () => {
    if (isUpgrading) {
      return strings.modals.Plans.advice;
    }
    if (hasSubscription) {
      return (
        <>
          {strings.modals.Plans.yourCurrentPlan}{' '}
          <AppText semibold style={tailwind('')}>
            {prettysize(limit).replace(' ', '')}
          </AppText>
        </>
      );
    }
  };

  const onClosed = () => {
    props.onClose();
  };

  const handleBuySubscription = async () => {
    try {
      if (!TRIAL_CODE) {
        notifications.error(strings.pcCloud.error);
        errorService.reportError(new Error('Trial code missing from environment variables'));
        return;
      }

      setLoadingCheckout(true);

      const success = await paymentService.startTrialSubscriptionFromApp(TRIAL_CODE);

      if (!success) {
        notifications.error(strings.pcCloud.error1);
      } else {
        props.onClose();
      }
    } catch (error) {
      notifications.error(strings.errors.generic.title);
      errorService.reportError(error);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const header = <View style={tailwind('bg-white')}></View>;

  return (
    <BottomModal
      isOpen={props.isOpen}
      onClosed={onClosed}
      header={header}
      modalStyle={tailwind('pt-16')}
      containerStyle={tailwind('pb-6 pt-6 px-4')}
      headerStyle={tailwind('bg-transparent absolute z-20')}
    >
      <ScrollView>
        <View style={tailwind('')}>
          <View style={tailwind('items-center')}>
            <FileIcon width={80} height={80} />
          </View>
          <AppText style={tailwind('text-center text-2xl mt-3')} medium>
            {getPlanUpgradeTitle()}
          </AppText>
          <AppText lineHeight={1.2} style={tailwind('text-center text-gray-60 mb-10')}>
            {getPlanUpgradeSubtitle()}
          </AppText>
        </View>

        <View>
          <AppText style={tailwind('text-center text-xl mb-4')} semibold>
            {strings.pcCloud.planTitle}
          </AppText>

          <View style={tailwind('bg-gray-5 rounded-xl p-4 mb-6')}>
            <View style={tailwind('flex-row justify-between mb-2')}>
              <AppText style={tailwind('text-gray-80')}>{strings.pcCloud.space}</AppText>
              <AppText style={tailwind('text-gray-100')} semibold>
                {strings.pcCloud.spaceValue}
              </AppText>
            </View>

            <View style={tailwind('flex-row justify-between mb-2')}>
              <AppText style={tailwind('text-gray-80')}>{strings.pcCloud.period}</AppText>
              <AppText style={tailwind('text-gray-100')} semibold>
                {strings.pcCloud.periodValue}
              </AppText>
            </View>

            <View style={tailwind('flex-row justify-between mb-2')}>
              <AppText style={tailwind('text-gray-80')}>{strings.pcCloud.price}</AppText>
              <AppText style={tailwind('text-gray-100')} semibold>
                {strings.pcCloud.priceValue}
              </AppText>
            </View>

            <View style={tailwind('flex-row justify-between')}>
              <AppText style={tailwind('text-gray-80')}>{strings.pcCloud.freeTrial}</AppText>
              <AppText style={tailwind('text-gray-100')} semibold>
                {strings.pcCloud.freeTrialValue}
              </AppText>
            </View>
          </View>
        </View>

        {hasStorageOverlflow ? (
          <Animated.View entering={FadeInDown}>
            <View style={tailwind('mt-3 p-4 rounded-lg bg-red/5 border border-red/15 mb-6')}>
              <View style={tailwind('mb-4')}>
                <StorageUsageBar limitBytes={limit} usageBytes={usage} selectedStorageBytes={TB_5_IN_BYTES} />
              </View>
              <View style={tailwind('flex flex-row items-end')}>
                <AppText semibold style={tailwind('text-sm text-red')}>
                  {strings.formatString(strings.modals.Plans.freeUpSpace.title, storageService.toString(TB_5_IN_BYTES))}
                </AppText>
                <AppText style={tailwind('text-sm text-red ml-1')}>({storageService.toString(usage)})</AppText>
              </View>
              <AppText style={[tailwind('text-sm text-red mt-0.5'), { lineHeight: getLineHeight(14, 1.2) }]}>
                {strings.modals.Plans.freeUpSpace.message}
              </AppText>
            </View>
          </Animated.View>
        ) : null}

        {/* Botón de compra */}
        <AppButton
          style={tailwind('mb-6 rounded-xl')}
          type="accept"
          disabled={loadingCheckout || isAlreadyOn5TBPlan}
          loading={loadingCheckout}
          title={isAlreadyOn5TBPlan ? strings.pcCloud.alreadyOnPlan : strings.pcCloud.buyPlan}
          onPress={handleBuySubscription}
        />

        <View style={tailwind('border-b border-gray-5 my-5')}></View>

        <View style={tailwind('mt-auto')}>
          <AppText style={tailwind('text-center text-sm')} semibold>
            {strings.modals.Plans.moneyBack}
          </AppText>
          <AppText style={tailwind('text-center text-sm mb-3')} semibold>
            {strings.modals.Plans.cancelAtAnyMoment}
          </AppText>
          <AppText lineHeight={1.2} style={tailwind('text-xs text-gray-40 text-center')}>
            {strings.modals.Plans.subscriptionRenew}
          </AppText>
        </View>
      </ScrollView>
    </BottomModal>
  );
};

export default PlansModal;
