<script lang="ts">
  import FormArchiveFolderSelect from '../forms/FormArchiveFolderSelect.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSelectField from '../forms/FormSelectField.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FormTextField from '../forms/FormTextField.svelte';
  import { currentArchive } from '../stores';
  import { _t } from '../translations';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';

  export let file = 'new-table';
  export let folder = $currentArchive;
  export let onSave;
  export let fileIsReadOnly = false;

  const handleSubmit = async e => {
    const { file, folder } = e.detail;
    closeCurrentModal();
    if (onSave) onSave(folder, file);
  };
</script>

<FormProvider initialValues={{ file, folder }}>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">{_t('saveArchiveModal.saveToArchive', { defaultMessage: 'Save to archive' })}</svelte:fragment>

    <FormArchiveFolderSelect label={_t('saveArchiveModal.folder', { defaultMessage: 'Folder' })} name="folder" isNative allowCreateNew skipZipFiles />
    <FormTextField label={_t('saveArchiveModal.fileName', { defaultMessage: 'File name' })} name="file" disabled={fileIsReadOnly} />

    <svelte:fragment slot="footer">
      <FormSubmit value={_t('common.save', { defaultMessage: 'Save' })} on:click={handleSubmit} />
    </svelte:fragment>
  </ModalBase>
</FormProvider>
