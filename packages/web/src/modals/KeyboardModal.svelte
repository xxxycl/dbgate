<script lang="ts">
  import _ from 'lodash';

  import TextField from '../forms/TextField.svelte';
  import keycodes from '../utility/keycodes';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { _t } from '../translations';

  export let onChange;
  let value;

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.keyCode == keycodes.escape) {
      closeCurrentModal();
      return;
    }

    if (e.keyCode == keycodes.enter && value) {
      onChange(value);
      closeCurrentModal();
      return;
    }

    let keyText = '';
    if (e.ctrlKey) keyText += _t('keyboardModal.ctrl', { defaultMessage: 'Ctrl' }) + '+';
    if (e.shiftKey) keyText += _t('keyboardModal.shift', { defaultMessage: 'Shift' }) + '+';
    if (e.metaKey) keyText += _t('keyboardModal.command', { defaultMessage: 'Command' }) + '+';
    if (e.altKey) keyText += _t('keyboardModal.alt', { defaultMessage: 'Alt' }) + '+';
    if (e.key != 'Control' && e.key != 'Alt' && e.key != 'Shift' && e.key != 'Meta') {
      keyText += _.upperFirst(e.key);
    }

    value = keyText;
  }
</script>

<ModalBase {...$$restProps} simple>
  <div class="mb-2">{_t('keyboardModal.instruction', { defaultMessage: 'Show desired key combination and press ENTER' })}</div>
  <div class="largeFormMarker">
    <TextField on:keydown={handleKeyDown} bind:value focused />
  </div>
</ModalBase>

<style>
</style>
