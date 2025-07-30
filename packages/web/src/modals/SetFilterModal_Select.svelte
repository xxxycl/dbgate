<script lang="ts">
  import FormSelectFieldRaw from '../forms/FormSelectFieldRaw.svelte';
  import { _t } from '../translations';

  export let name;
  export let filterBehaviour;

  function getOptions() {
    const res = [];
    if (filterBehaviour.supportEquals) {
      res.push(
        { value: '=', label: _t('setFilterModal.equals', { defaultMessage: 'equals' }) },
        { value: '<>', label: _t('setFilterModal.doesNotEqual', { defaultMessage: 'does not equal' }) }
      );
    }

    if (filterBehaviour.supportStringInclusion) {
      res.push(
        { value: '+', label: _t('setFilterModal.contains', { defaultMessage: 'contains' }) },
        { value: '~', label: _t('setFilterModal.doesNotContain', { defaultMessage: 'does not contain' }) },
        { value: '^', label: _t('setFilterModal.beginsWith', { defaultMessage: 'begins with' }) },
        { value: '!^', label: _t('setFilterModal.doesNotBeginWith', { defaultMessage: 'does not begin with' }) },
        { value: '$', label: _t('setFilterModal.endsWith', { defaultMessage: 'ends with' }) },
        { value: '!$', label: _t('setFilterModal.doesNotEndWith', { defaultMessage: 'does not end with' }) }
      );
    }

    if (filterBehaviour.supportNumberLikeComparison) {
      res.push(
        { value: '<', label: _t('setFilterModal.isSmaller', { defaultMessage: 'is smaller' }) },
        { value: '>', label: _t('setFilterModal.isGreater', { defaultMessage: 'is greater' }) },
        { value: '<=', label: _t('setFilterModal.isSmallerOrEqual', { defaultMessage: 'is smaller or equal' }) },
        { value: '>=', label: _t('setFilterModal.isGreaterOrEqual', { defaultMessage: 'is greater or equal' }) }
      );
    }

    if (filterBehaviour.supportDatetimeComparison) {
      res.push(
        { value: '<', label: _t('setFilterModal.isBefore', { defaultMessage: 'is before' }) },
        { value: '>', label: _t('setFilterModal.isAfter', { defaultMessage: 'is after' }) },
        { value: '<=', label: _t('setFilterModal.isBeforeOrEqual', { defaultMessage: 'is before or equal' }) },
        { value: '>=', label: _t('setFilterModal.isAfterOrEqual', { defaultMessage: 'is after or equal' }) }
      );
    }

    if (filterBehaviour.supportNullTesting) {
      res.push(
        { value: 'NULL', label: _t('setFilterModal.isNull', { defaultMessage: 'is NULL' }) },
        { value: 'NOT NULL', label: _t('setFilterModal.isNotNull', { defaultMessage: 'is not NULL' }) }
      );
    }

    if (filterBehaviour.supportExistsTesting) {
      res.push(
        { value: 'EXISTS', label: _t('setFilterModal.fieldExists', { defaultMessage: 'field exists' }) },
        { value: 'NOT EXISTS', label: _t('setFilterModal.fieldDoesNotExist', { defaultMessage: 'field does not exist' }) }
      );
    }

    if (filterBehaviour.supportSqlCondition) {
      res.push(
        { value: 'sql', label: _t('setFilterModal.sqlCondition', { defaultMessage: 'SQL condition' }) },
        { value: 'sqlRight', label: _t('setFilterModal.sqlConditionRightSideOnly', { defaultMessage: 'SQL condition - right side only' }) }
      );
    }

    return res;
  }
</script>

<FormSelectFieldRaw {name} options={getOptions()} isNative />
