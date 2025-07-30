<script lang="ts">
  import { _t } from '../translations';

  export let sourceDragColumn$;
  export let targetDragColumn$;
  export let settings;

  let memory;
</script>

{#if settings?.allowCreateRefByDrag}
  <div
    class="wrapper"
    draggable={!!memory}
    title={memory ? _t('dragColumnMemory.dragToCreate', { defaultMessage: 'Drag this column to other column for creating JOIN' }) : _t('dragColumnMemory.dragHere', { defaultMessage: 'Drag column here for creating JOIN' })}
    on:dragstart={e => {
      if (!settings?.allowCreateRefByDrag) return;
      if (!memory) return;

      const dragData = { ...memory };
      sourceDragColumn$.set(dragData);
      e.dataTransfer.setData('designer_column_drag_data', JSON.stringify(dragData));
    }}
    on:dragend={e => {
      sourceDragColumn$.set(null);
      targetDragColumn$.set(null);
    }}
    on:dragover={e => {
      if ($sourceDragColumn$) {
        e.preventDefault();
      }
    }}
    on:drop={e => {
      var data = e.dataTransfer.getData('designer_column_drag_data');
      e.preventDefault();
      if (!data) return;
      memory = $sourceDragColumn$;
      sourceDragColumn$.set(null);
      targetDragColumn$.set(null);
    }}
  >
    {#if memory}
      {memory.columnName}
    {:else}
      Drag & drop column here
    {/if}
  </div>
{/if}

<style>
  .wrapper {
    border: 1px solid var(--theme-border);
    padding: 3px;
    color: var(--theme-font-2);
  }
</style>
