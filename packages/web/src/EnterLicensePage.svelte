<script lang="ts">
  import { useConfig } from './utility/metadataLoaders';
  import Link from './elements/Link.svelte';
  import { internalRedirectTo } from './clientAuth';
  import { writable } from 'svelte/store';
  import FormProviderCore from './forms/FormProviderCore.svelte';
  import FormTextAreaField from './forms/FormTextAreaField.svelte';
  import FormSubmit from './forms/FormSubmit.svelte';
  import { apiCall } from './utility/api';
  import FormStyledButton from './buttons/FormStyledButton.svelte';
  import getElectron from './utility/getElectron';
  import SpecialPageLayout from './widgets/SpecialPageLayout.svelte';
  import hasPermission from './utility/hasPermission';
  import ErrorInfo from './elements/ErrorInfo.svelte';
  import { isOneOfPage } from './utility/pageDefs';
  import { openWebLink } from './utility/simpleTools';
  import { _t } from './translations';

  const config = useConfig();
  const values = writable({ amoid: null, databaseServer: null });

  $: isExpired = $config?.isLicenseExpired;
  $: trialDaysLeft = $config?.trialDaysLeft;

  let errorMessage = '';
  let expiredMessageSet = false;

  $: if (isExpired && !expiredMessageSet) {
    errorMessage = _t('enterLicensePage.licenseExpired', { defaultMessage: 'Your license is expired' });
    expiredMessageSet = true;
  }

  // $: console.log('CONFIG', $config);

  $: {
    if ($config?.isLicenseValid) {
      internalRedirectTo(isOneOfPage('admin-license') ? '/admin.html' : '/index.html');
    }
  }
</script>

<FormProviderCore {values}>
  <SpecialPageLayout>
    {#if getElectron() || ($config?.storageDatabase && hasPermission('admin/license'))}
      <div class="heading">{_t('enterLicensePage.license', { defaultMessage: 'License' })}</div>
      <FormTextAreaField label={_t('enterLicensePage.enterLicenseKey', { defaultMessage: 'Enter your license key' })} name="licenseKey" rows={5} />

      <div class="submit">
        <FormSubmit
          value={_t('enterLicensePage.saveLicense', { defaultMessage: 'Save license' })}
          on:click={async e => {
            sessionStorage.setItem('continueTrialConfirmed', '1');
            const { licenseKey } = e.detail;
            const resp = await apiCall('config/save-license-key', { licenseKey, tryToRenew: true });
            if (resp?.status == 'ok') {
              internalRedirectTo(isOneOfPage('admin-license') ? '/admin.html' : '/index.html');
            } else {
              errorMessage = resp?.errorMessage || _t('enterLicensePage.errorSavingLicense', { defaultMessage: 'Error saving license key' });
            }
          }}
        />
      </div>

      {#if !isExpired && trialDaysLeft == null}
        <div class="submit">
          <FormStyledButton
            value={_t('enterLicensePage.startTrial', { defaultMessage: 'Start 30-day trial' })}
            on:click={async e => {
              errorMessage = '';
              const license = await apiCall('config/start-trial');
              if (license?.status == 'ok') {
                sessionStorage.setItem('continueTrialConfirmed', '1');
                internalRedirectTo(isOneOfPage('admin-license') ? '/admin.html' : '/index.html');
              } else {
                errorMessage = license?.errorMessage || _t('enterLicensePage.errorStartingTrial', { defaultMessage: 'Error starting trial' });
              }
            }}
          />
        </div>
      {/if}

      {#if trialDaysLeft > 0}
        <div class="submit">
          <FormStyledButton
            value={_t('enterLicensePage.continueTrial', { defaultMessage: 'Continue trial ({daysLeft} days left)', values: { daysLeft: trialDaysLeft } })}
            on:click={async e => {
              sessionStorage.setItem('continueTrialConfirmed', '1');
              internalRedirectTo(isOneOfPage('admin-license') ? '/admin.html' : '/index.html');
            }}
          />
        </div>
      {/if}

      <div class="submit">
        <FormStyledButton
          value={_t('enterLicensePage.purchasePremium', { defaultMessage: 'Purchase DbGate Premium' })}
          on:click={async e => {
            // openWebLink(
            //   `https://auth.dbgate.eu/create-checkout-session-simple?source=trial-${isExpired ? 'expired' : (trialDaysLeft ?? 'no')}`
            // );

            // openWebLink(
            //   `https://auth-proxy.dbgate.udolni.net/redirect-to-purchase?product=${getElectron() ? 'premium' : 'teram-premium'}&source=trial-${isExpired ? 'expired' : (trialDaysLeft ?? 'no')}`
            // );

            openWebLink(
              `https://auth.dbgate.eu/redirect-to-purchase?product=${getElectron() ? 'premium' : 'team-premium'}&source=trial-${isExpired ? 'expired' : (trialDaysLeft ?? 'no')}`
            );
          }}
        />
      </div>

      {#if getElectron()}
        <div class="submit">
          <FormStyledButton
            value={_t('enterLicensePage.exit', { defaultMessage: 'Exit' })}
            on:click={e => {
              getElectron().send('quit-app');
            }}
          />
        </div>
      {/if}

      {#if errorMessage}
        <div class="error">{errorMessage}</div>
      {/if}

      <div class="purchase-info">
        {_t('enterLicensePage.moreInfo', { defaultMessage: 'For more info about DbGate licensing, you could visit' })} <Link href="https://dbgate.eu/">dbgate.eu</Link> {_t('enterLicensePage.webOrContact', { defaultMessage: 'web or contact us at' })} <Link href="mailto:sales@dbgate.eu">sales@dbgate.eu</Link>
      </div>
    {:else}
      <ErrorInfo message={_t('enterLicensePage.invalidLicense', { defaultMessage: 'License for DbGate is not valid. Please contact administrator.' })} />
    {/if}
  </SpecialPageLayout>
</FormProviderCore>

<style>
  .heading {
    text-align: center;
    margin: 1em;
    font-size: xx-large;
  }

  .submit {
    margin: var(--dim-large-form-margin);
    display: flex;
  }

  .submit :global(input) {
    flex: 1;
    font-size: larger;
  }

  .error {
    margin: var(--dim-large-form-margin);
    color: red;
  }

  .purchase-info {
    margin: var(--dim-large-form-margin);
  }
</style>
