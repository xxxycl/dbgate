<script lang="ts">
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FormTextField from '../forms/FormTextField.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { _t } from '../translations';

  export let onConfirm;
  export let url;

  const handleSubmit = e => {
    onConfirm(e.detail.url);
    closeCurrentModal();
  };
</script>

<FormProvider initialValues={{ url }}>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">{_t('changeDownloadUrlModal.downloadFromWeb', { defaultMessage: 'Download imported file from web' })}</svelte:fragment>

    <FormTextField label={_t('changeDownloadUrlModal.url', { defaultMessage: 'URL' })} name="url" style={{ width: '30vw' }} focused />

    <svelte:fragment slot="footer">
      <FormSubmit value={_t('changeDownloadUrlModal.ok', { defaultMessage: 'OK' })} on:click={handleSubmit} />
      <FormStyledButton value={_t('changeDownloadUrlModal.cancel', { defaultMessage: 'Cancel' })} on:click={closeCurrentModal} />
    </svelte:fragment>
  </ModalBase>
</FormProvider>
