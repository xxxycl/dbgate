<script lang="ts">
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import DbKeyItemDetail from '../dbkeyvalue/DbKeyItemDetail.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { _t } from '../translations';

  export let keyInfo;
  export let label;
  export let onConfirm;

  let item = {};

  const handleSubmit = async () => {
    if (await onConfirm(item)) {
      closeCurrentModal();
    }
  };
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">{_t('dbKeyAddItemModal.addItem', { defaultMessage: 'Add item' })}</svelte:fragment>

    <div class="container">
      <DbKeyItemDetail
        dbKeyFields={keyInfo.keyType.dbKeyFields}
        {item}
        onChangeItem={value => {
          item = value;
        }}
      />
    </div>

    <svelte:fragment slot="footer">
      <FormStyledButton value={_t('common.ok', { defaultMessage: 'OK' })} on:click={e => handleSubmit()} />
      <FormStyledButton type="button" value={_t('common.cancel', { defaultMessage: 'Cancel' })} on:click={closeCurrentModal} />
    </svelte:fragment>
  </ModalBase>
</FormProvider>

<style>
  .container {
    display: flex;
    height: 30vh;
  }
</style>
