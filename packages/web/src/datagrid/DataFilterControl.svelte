<script context="module">
</script>

<script>
  import { createMultiLineFilter, parseFilter } from 'dbgate-filterparser';
  import splitterDrag from '../utility/splitterDrag';

  import FilterMultipleValuesModal from '../modals/FilterMultipleValuesModal.svelte';
  import { getFilterValueExpression } from 'dbgate-filterparser';

  import { showModal } from '../modals/modalTools';
  import { _t } from '../translations';
  import SetFilterModal from '../modals/SetFilterModal.svelte';
  import keycodes from '../utility/keycodes';

  import DropDownButton from '../buttons/DropDownButton.svelte';
  import InlineButton from '../buttons/InlineButton.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import DictionaryLookupModal from '../modals/DictionaryLookupModal.svelte';
  import ValueLookupModal from '../modals/ValueLookupModal.svelte';

  export let isReadOnly = false;
  export let filterBehaviour;
  export let filter;
  export let setFilter;
  export let showResizeSplitter = false;
  export let onFocusGrid = null;
  export let onGetReference = null;
  export let foreignKey = null;
  export let conid = null;
  export let database = null;
  export let driver = null;
  export let jslid = null;
  export let customCommandIcon = null;
  export let onCustomCommand = null;
  export let customCommandTooltip = null;
  export let formatterFunction = null;

  export let pureName = null;
  export let schemaName = null;
  export let columnName = null;
  export let uniqueName = null;
  export let dataType = null;

  export let placeholder = 'Filter';

  let value;
  let isError;
  let isOk;
  let domInput;

  $: if (onGetReference && domInput) onGetReference(domInput);

  function openFilterWindow(condition1) {
    showModal(SetFilterModal, { condition1, filterBehaviour, onFilter: setFilter });
  }

  const filterMultipleValues = () => {
    showModal(FilterMultipleValuesModal, {
      onFilter: (mode, text) => setFilter(createMultiLineFilter(mode, text)),
    });
  };

  function createMenu() {
    const res = [
      { onClick: () => setFilter(''), text: _t('dataFilter.clearFilter', { defaultMessage: 'Clear Filter' }) },
      { onClick: () => filterMultipleValues(), text: _t('dataFilter.filterMultipleValues', { defaultMessage: 'Filter multiple values' }) },
    ];

    if (filterBehaviour.supportEquals) {
      res.push(
        { onClick: () => openFilterWindow('='), text: _t('dataFilter.equals', { defaultMessage: 'Equals...' }) },
        { onClick: () => openFilterWindow('<>'), text: _t('dataFilter.doesNotEqual', { defaultMessage: 'Does Not Equal...' }) }
      );
    }

    if (filterBehaviour.supportExistsTesting) {
      res.push(
        { onClick: () => setFilter('EXISTS'), text: _t('dataFilter.fieldExists', { defaultMessage: 'Field exists' }) },
        { onClick: () => setFilter('NOT EXISTS'), text: _t('dataFilter.fieldDoesNotExist', { defaultMessage: 'Field does not exist' }) }
      );
    }

    if (filterBehaviour.supportNotEmptyArrayTesting) {
      res.push({ onClick: () => setFilter('NOT EMPTY ARRAY'), text: _t('dataFilter.arrayIsNotEmpty', { defaultMessage: 'Array is not empty' }) });
    }

    if (filterBehaviour.supportEmptyArrayTesting) {
      res.push({ onClick: () => setFilter('EMPTY ARRAY'), text: _t('dataFilter.arrayIsEmpty', { defaultMessage: 'Array is empty' }) });
    }

    if (filterBehaviour.supportNullTesting) {
      res.push(
        { onClick: () => setFilter('NULL'), text: _t('dataFilter.isNull', { defaultMessage: 'Is Null' }) },
        { onClick: () => setFilter('NOT NULL'), text: _t('dataFilter.isNotNull', { defaultMessage: 'Is Not Null' }) }
      );
    }

    if (filterBehaviour.supportEmpty) {
      res.push(
        { onClick: () => setFilter('EMPTY, NULL'), text: _t('dataFilter.isEmptyOrNull', { defaultMessage: 'Is Empty Or Null' }) },
        { onClick: () => setFilter('NOT EMPTY NOT NULL'), text: _t('dataFilter.hasNotEmptyValue', { defaultMessage: 'Has Not Empty Value' }) }
      );
    }

    if (filterBehaviour.supportNumberLikeComparison) {
      res.push(
        { divider: true },

        { onClick: () => openFilterWindow('>'), text: _t('dataFilter.greaterThan', { defaultMessage: 'Greater Than...' }) },
        { onClick: () => openFilterWindow('>='), text: _t('dataFilter.greaterThanOrEqual', { defaultMessage: 'Greater Than Or Equal To...' }) },
        { onClick: () => openFilterWindow('<'), text: _t('dataFilter.lessThan', { defaultMessage: 'Less Than...' }) },
        { onClick: () => openFilterWindow('<='), text: _t('dataFilter.lessThanOrEqual', { defaultMessage: 'Less Than Or Equal To...' }) }
      );
    }

    if (filterBehaviour.supportStringInclusion) {
      res.push(
        { divider: true },

        { onClick: () => openFilterWindow('+'), text: _t('dataFilter.contains', { defaultMessage: 'Contains...' }) },
        { onClick: () => openFilterWindow('~'), text: _t('dataFilter.doesNotContain', { defaultMessage: 'Does Not Contain...' }) },
        { onClick: () => openFilterWindow('^'), text: _t('dataFilter.beginsWith', { defaultMessage: 'Begins With...' }) },
        { onClick: () => openFilterWindow('!^'), text: _t('dataFilter.doesNotBeginWith', { defaultMessage: 'Does Not Begin With...' }) },
        { onClick: () => openFilterWindow('$'), text: _t('dataFilter.endsWith', { defaultMessage: 'Ends With...' }) },
        { onClick: () => openFilterWindow('!$'), text: _t('dataFilter.doesNotEndWith', { defaultMessage: 'Does Not End With...' }) }
      );
    }

    if (filterBehaviour.supportBooleanValues) {
      res.push(
        { onClick: () => setFilter('TRUE'), text: 'Is True' },
        { onClick: () => setFilter('FALSE'), text: 'Is False' }
      );
    }

    if (filterBehaviour.supportBooleanOrNull) {
      res.push(
        { onClick: () => setFilter('TRUE, NULL'), text: 'Is True or NULL' },
        { onClick: () => setFilter('FALSE, NULL'), text: 'Is False or NULL' }
      );
    }

    if (filterBehaviour.supportDatetimeSymbols) {
      res.push(
        { divider: true },

        { onClick: () => setFilter('TOMORROW'), text: 'Tomorrow' },
        { onClick: () => setFilter('TODAY'), text: 'Today' },
        { onClick: () => setFilter('YESTERDAY'), text: 'Yesterday' },

        { divider: true },

        { onClick: () => setFilter('NEXT WEEK'), text: 'Next Week' },
        { onClick: () => setFilter('THIS WEEK'), text: 'This Week' },
        { onClick: () => setFilter('LAST WEEK'), text: 'Last Week' },

        { divider: true },

        { onClick: () => setFilter('NEXT MONTH'), text: 'Next Month' },
        { onClick: () => setFilter('THIS MONTH'), text: 'This Month' },
        { onClick: () => setFilter('LAST MONTH'), text: 'Last Month' },

        { divider: true },

        { onClick: () => setFilter('NEXT YEAR'), text: 'Next Year' },
        { onClick: () => setFilter('THIS YEAR'), text: 'This Year' },
        { onClick: () => setFilter('LAST YEAR'), text: 'Last Year' }
      );
    }

    if (filterBehaviour.supportDatetimeComparison) {
      res.push(
        { divider: true },
        { onClick: () => openFilterWindow('<='), text: 'Before...' },
        { onClick: () => openFilterWindow('>='), text: 'After...' },
        { onClick: () => openFilterWindow('>=;<='), text: 'Between...' }
      );
    }

    if (filterBehaviour.supportSqlCondition) {
      res.push(
        { divider: true },
        { onClick: () => openFilterWindow('sql'), text: 'SQL condition ...' },
        { onClick: () => openFilterWindow('sqlRight'), text: 'SQL condition - right side ...' }
      );
    }

    return res;
  }

  const handleKeyDown = ev => {
    if (isReadOnly) return;
    if (ev.keyCode == keycodes.enter) {
      applyFilter();
    }
    if (ev.keyCode == keycodes.escape) {
      setFilter('');
    }
    if (ev.keyCode == keycodes.downArrow) {
      if (onFocusGrid) onFocusGrid();
      // ev.stopPropagation();
      ev.preventDefault();
    }
    // if (ev.keyCode == KeyCodes.DownArrow || ev.keyCode == KeyCodes.UpArrow) {
    //     if (this.props.onControlKey) this.props.onControlKey(ev.keyCode);
    // }
  };

  function handlePaste(event) {
    var pastedText = undefined;
    // @ts-ignore
    if (window.clipboardData && window.clipboardData.getData) {
      // IE
      // @ts-ignore
      pastedText = window.clipboardData.getData('Text');
    } else if (event.clipboardData && event.clipboardData.getData) {
      pastedText = event.clipboardData.getData('text/plain');
    }
    if (pastedText && pastedText.includes('\n')) {
      event.preventDefault();
      setFilter(createMultiLineFilter('is', pastedText));
    }
  }

  function handleShowDictionary() {
    showModal(DictionaryLookupModal, {
      conid,
      database,
      driver,
      pureName: foreignKey.refTableName,
      schemaName: foreignKey.refSchemaName,
      multiselect: true,
      dataType,
      onConfirm: keys => setFilter(keys.join(',')),
    });
  }

  function handleShowValuesModal() {
    showModal(ValueLookupModal, {
      conid,
      database,
      driver,
      jslid,
      multiselect: true,
      schemaName,
      pureName,
      field: columnName || uniqueName,
      formatterFunction,
      dataType,
      onConfirm: keys => setFilter(keys.map(x => getFilterValueExpression(x)).join(',')),
    });
  }

  $: value = filter;

  $: {
    try {
      isOk = false;
      isError = false;
      if (value) {
        parseFilter(value, filterBehaviour);
        isOk = true;
      }
    } catch (err) {
      // console.error(err);
      isError = true;
    }
  }

  function applyFilter() {
    if ((filter || '') == (value || '')) return;
    setFilter(value);
  }

  // $: if (value != filter) setFilter(value);
</script>

<div class="flex">
  <input
    bind:this={domInput}
    type="text"
    autocomplete="off"
    readOnly={isReadOnly}
    bind:value
    on:keydown={handleKeyDown}
    on:blur={applyFilter}
    on:paste={handlePaste}
    class:isError
    class:isOk
    {placeholder}
    data-testid={`DataFilterControl_input_${uniqueName}`}
  />
  {#if customCommandIcon && onCustomCommand}
    <InlineButton on:click={onCustomCommand} title={customCommandTooltip} narrow square>
      <FontIcon icon={customCommandIcon} />
    </InlineButton>
  {/if}
  {#if conid && database && driver}
    {#if driver?.databaseEngineTypes?.includes('sql') && foreignKey}
      <InlineButton
        on:click={handleShowDictionary}
        narrow
        square
        data-testid={`DataFilterControl_choosevalues_${uniqueName}`}
      >
        <FontIcon icon="icon dots-horizontal" />
      </InlineButton>
    {:else if (pureName && columnName) || (pureName && uniqueName && driver?.databaseEngineTypes?.includes('document'))}
      <InlineButton
        on:click={handleShowValuesModal}
        narrow
        square
        data-testid={`DataFilterControl_choosevalues_${uniqueName}`}
      >
        <FontIcon icon="icon dots-vertical" />
      </InlineButton>
    {/if}
  {:else if jslid}
    <InlineButton on:click={handleShowValuesModal} narrow square>
      <FontIcon icon="icon dots-vertical" />
    </InlineButton>
  {/if}
  <DropDownButton
    icon="icon filter"
    menu={createMenu}
    narrow
    data-testid={`DataFilterControl_filtermenu_${uniqueName}`}
  />
  {#if showResizeSplitter}
    <div class="horizontal-split-handle resizeHandleControl" use:splitterDrag={'clientX'} on:resizeSplitter />
  {/if}
</div>

<style>
  input {
    flex: 1;
    min-width: 10px;
    width: 1px;
  }

  input.isError {
    background-color: var(--theme-bg-red);
  }

  input.isOk {
    background-color: var(--theme-bg-green);
  }
</style>
