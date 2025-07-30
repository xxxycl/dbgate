<script lang="ts">
  import FontIcon from '../icons/FontIcon.svelte';

  import InlineButton from './InlineButton.svelte';
  import { _t } from '../translations';

  export let filter;
  export let showDisabled = false;
  export let onClearFilter = null;
</script>

{#if filter || showDisabled}
  <InlineButton
    on:click
    on:click={() => {
      if (onClearFilter) {
        onClearFilter();
      } else {
        filter = '';
      }
    }}
    title={_t('closeSearchButton.clearFilter', { defaultMessage: 'Clear filter' })}
    disabled={!filter}
  >
    <FontIcon icon="icon close" />
  </InlineButton>
{/if}
