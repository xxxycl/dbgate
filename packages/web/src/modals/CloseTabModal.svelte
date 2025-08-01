<script lang="ts">
  import { get } from 'svelte/store';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import { getKeyTextFromEvent, resolveKeyText } from '../utility/common';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { commandsCustomized } from '../stores';
  import { _t } from '../translations';

  export let tabs;
  export let onConfirm;
  export let onCancel;

  function handleKeyDown(e) {
    const commandsValue = get(commandsCustomized);

    const command = commandsValue['tabs.closeTab'];
    if (resolveKeyText(command.keyText).toLowerCase() == getKeyTextFromEvent(e).toLowerCase()) {
      closeCurrentModal();
      onConfirm();
    }
  }
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">{_t('closeTabModal.confirmCloseTabs', { defaultMessage: 'Confirm close tabs' })}</svelte:fragment>

    <div>
      {_t('closeTabModal.modifiedFilesMessage', { defaultMessage: 'Following files are modified, really close tabs? After closing, you could reopen them in history' })}
      <FontIcon icon="icon history" />
      {_t('closeTabModal.widget', { defaultMessage: 'widget' })}
    </div>

    {#each tabs as tab}
      <div class="ml-2"><FontIcon icon={tab.icon} /> {tab.title}</div>
    {/each}

    <svelte:fragment slot="footer">
      <FormSubmit
        value={_t('closeTabModal.closeTabs', { defaultMessage: 'Close tabs' })}
        on:click={() => {
          closeCurrentModal();
          onConfirm();
        }}
      />
      <FormStyledButton
        type="button"
        value={_t('closeTabModal.cancel', { defaultMessage: 'Cancel' })}
        on:click={() => {
          closeCurrentModal();
          onCancel();
        }}
      />
    </svelte:fragment>
  </ModalBase>
</FormProvider>

<svelte:window on:keydown={handleKeyDown} />
