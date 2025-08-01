<script lang="ts">
  import FormButton from '../forms/FormButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FormTextFieldRaw from '../forms/FormTextFieldRaw.svelte';
  import FormFieldTemplateLarge from '../forms/FormFieldTemplateLarge.svelte';
  import SetFilterModal_Select from './SetFilterModal_Select.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import FormRadioGroupItem from '../forms/FormRadioGroupItem.svelte';
  import FormValues from '../forms/FormValues.svelte';
  import { _t } from '../translations';

  export let condition1;
  export let onFilter;
  export let filterBehaviour;

  const hasOperand = condition => {
    return condition != 'NULL' && condition != 'NOT NULL' && condition != 'EXISTS' && condition != 'NOT EXISTS';
  };

  const createTerm = (condition, value) => {
    if (!hasOperand(condition)) return condition;
    if (!value) return null;
    if (condition == 'sql') return `{${value}}`;
    if (condition == 'sqlRight') return `{$$ ${value}}`;
    if (filterBehaviour.allowStringToken) {
      return `${condition}"${value}"`;
    }
    return `${condition}${value}`;
  };

  const handleOk = e => {
    const values = e.detail;
    const { value1, condition1, value2, condition2, joinOperator } = values;
    const term1 = createTerm(condition1, value1);
    const term2 = createTerm(condition2, value2);
    if (term1 && term2) onFilter(`${term1}${joinOperator}${term2}`);
    else if (term1) onFilter(term1);
    else if (term2) onFilter(term2);
    closeCurrentModal();
  };
</script>

<FormProvider initialValues={{ condition1, condition2: '=', joinOperator: ' ' }} template={FormFieldTemplateLarge}>
  <ModalBase {...$$restProps}>
    <div slot="header">{_t('setFilterModal.title', { defaultMessage: 'Set filter' })}</div>

    <div class="largeFormMarker">
      <div class="row">{_t('setFilterModal.showRowsWhere', { defaultMessage: 'Show rows where' })}</div>
      <div class="row">
        <div class="col-6 mr-1">
          <SetFilterModal_Select {filterBehaviour} name="condition1" />
        </div>
        <div class="col-6 mr-1">
          <FormValues let:values>
            {#if hasOperand(values.condition1)}
              <FormTextFieldRaw name="value1" focused />
            {/if}
          </FormValues>
        </div>
      </div>

      <div class="row">
        <FormRadioGroupItem name="joinOperator" value=" " text={_t('setFilterModal.and', { defaultMessage: 'And' })} />
        {#if !filterBehaviour.disableOr}
          <FormRadioGroupItem name="joinOperator" value="," text={_t('setFilterModal.or', { defaultMessage: 'Or' })} />
        {/if}
      </div>

      <div class="row">
        <div class="col-6 mr-1">
          <SetFilterModal_Select {filterBehaviour} name="condition2" />
        </div>
        <div class="col-6 mr-1">
          <FormValues let:values>
            {#if hasOperand(values.condition2)}
              <FormTextFieldRaw name="value2" />
            {/if}
          </FormValues>
        </div>
      </div>
    </div>

    <div slot="footer">
      <FormSubmit value={_t('common.ok', { defaultMessage: 'OK' })} on:click={handleOk} />
      <FormButton type="button" value={_t('common.close', { defaultMessage: 'Close' })} on:click={closeCurrentModal} />
    </div>
  </ModalBase>
</FormProvider>

<style>
  .row {
    margin: var(--dim-large-form-margin);
    display: flex;
  }
</style>
