<script>
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import { isProApp } from '../utility/proTools';
  import { openWebLink } from '../utility/simpleTools';

  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { _t } from '../translations';

  export let message;
  export let licenseLimits;
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <div slot="header">{_t('licenseLimitMessageModal.licenseLimitError', { defaultMessage: 'License limit error' })}</div>

    <div class="wrapper">
      <div class="icon">
        <FontIcon icon="img error" />
      </div>
      <div data-testid="LicenseLimitMessageModal_message">
        <p>
          {_t('licenseLimitMessageModal.cloudOperationError', { defaultMessage: 'Cloud operation ended with error:' })}<br />
          {message}
        </p>

        <p>
          {_t('licenseLimitMessageModal.freeVersionLimitation', { defaultMessage: 'This is a limitation of the free version of DbGate. To continue using cloud operations, please {downloadText} purchase DbGate Premium.', downloadText: !isProApp() ? _t('licenseLimitMessageModal.downloadAnd', { defaultMessage: 'download and' }) : '' })}
        </p>
        <p>{_t('licenseLimitMessageModal.freeVersionLimit', { defaultMessage: 'Free version limit:' })}</p>
        <ul>
          {#each licenseLimits || [] as limit}
            <li>{limit}</li>
          {/each}
        </ul>
      </div>
    </div>

    <div slot="footer">
      <FormSubmit value={_t('licenseLimitMessageModal.close', { defaultMessage: 'Close' })} on:click={closeCurrentModal} data-testid="LicenseLimitMessageModal_closeButton" />
      {#if !isProApp()}
        <FormStyledButton
          value={_t('licenseLimitMessageModal.downloadDbGatePremium', { defaultMessage: 'Download DbGate Premium' })}
          on:click={() => openWebLink('https://dbgate.io/download/')}
          skipWidth
        />
      {/if}
      <FormStyledButton
        value={_t('licenseLimitMessageModal.purchaseDbGatePremium', { defaultMessage: 'Purchase DbGate Premium' })}
        on:click={() => openWebLink('https://dbgate.io/purchase/premium/')}
        skipWidth
      />
    </div>
  </ModalBase>
</FormProvider>

<style>
  .wrapper {
    display: flex;
  }

  .icon {
    margin-right: 10px;
    font-size: 20pt;
    padding-top: 30px;
  }
</style>
