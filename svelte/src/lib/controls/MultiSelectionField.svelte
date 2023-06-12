<script lang="ts">
    import { uiContextKey, type IUiContext } from '$lib/context/UiContext';
    import type { IUiTheme } from '$lib/context/UiTheme';
    /**
     * Wrapper for svelte-select
     * https://github.com/rob-balfre/svelte-select
     */
    import { createEventDispatcher, getContext, onDestroy } from 'svelte';
    import type { IDropdownOption } from './DropdownField';
    import CloseIcon from '$lib/icons/CloseIcon.svelte';
    import { offset, flip, shift, type AlignedPlacement, type Strategy } from '@floating-ui/dom';
    import { createFloatingActions } from 'svelte-floating-ui';

    //*****************************************
    // Props
    //*****************************************
    export let name: string;
    export let values: string[];
    export let options: IDropdownOption[];
    export let disabled = false;
    export let clearable = true;
    export let focused = false;

    let container: any = undefined;
    let list: any = undefined;
    let listOpen = false;
    const listOffset = 5; 

    //*****************************************
    // Init
    //*****************************************
    const dispatch = createEventDispatcher();

    const uiContext = getContext(uiContextKey) as IUiContext;
    let { theme } = uiContext;
    let dropdownTheme = ($theme as IUiTheme).inlineFancyDropdownField ?? {};

    $: containerCss = dropdownTheme?.dropdownContainer;

    $: if (listOpen && container && list) setListWidth();
    $: hasValue = values.length > 0;
    $: if (listOpen && !focused) handleFocus();
    $: showClear = hasValue && clearable && !disabled;

    let _floatingConfig = {
        strategy: 'absolute' as Strategy,
        placement: 'bottom-start' as AlignedPlacement,
        middleware: [offset(listOffset), flip(), shift()],
        autoUpdate: false,
    };
    const [floatingRef, floatingContent] = createFloatingActions(_floatingConfig);
    $: if (container) {
        _floatingConfig.autoUpdate = true;
    }

    let rootId = `${name}_root`;
    let selectId = `${name}_select`;

    //***************************************
    // Helpers
    //***************************************
    const setListWidth = () => {
        const { width } = container.getBoundingClientRect();
        list.style.width = width + 'px';
    }

    const handleFocus = (e?: any) => {
        if (focused) {
            return;
        }

        focused = true;

        dispatch('focus', e);
    }

    const handleBlur = (e?: any) => {
        if (listOpen || focused) {
            closeList();
            focused = false;

            dispatch('blur', e);
        }
    }

    const closeList = () => {
        listOpen = false;
    }

    //***************************************
    // Event handlers
    //***************************************
    onDestroy(() => {
        list?.remove();
    });

    const handleClickOutside = (event: any) => {
        if (!container?.contains(event.target) && !list?.contains(event.target) ) {
            handleBlur();
        }
    }

    const handleClick = () => {
        if (disabled) {
            return;
        }

        listOpen = true;
    }

    const handleSelect = (e: any) => {
        const selection = e.detail.key;
        const selectedValues = [...values];
        if (!selectedValues.includes(selection)) {
            selectedValues.push(selection);
        }
        
        dispatch('change', { value: selectedValues });
    };

    const handleClear = (e: any) => {
        
    };
</script>

<svelte:window on:click={handleClickOutside} />

<div id={rootId} class="dropdown-field-root {dropdownTheme.root}">
    <div class="dropdown-field-select-container {containerCss}">
        <div id={selectId} class="svelte-select multi pl-4 flex" class:list-open={listOpen} use:floatingRef
            on:pointerup|preventDefault={handleClick}
            bind:this={container}>
            {#if listOpen}
                <div class="svelte-select-list" bind:this={list} use:floatingContent>
                    {#if options.length > 0}
                        {#each options as item, i}
                            <div class="list-item">
                                <div class="item">
                                    {item.text}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="empty">No options</div>
                    {/if}
                </div>
            {/if}
            <div class="value-container">
                <div />
            </div>
            <div class="indicators">
                {#if showClear}
                    <button type="button" class="icon clear-select" on:click={handleClear}>
                        <CloseIcon class="h-5 w-5 clear-icon" />
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .svelte-select-list {
        box-shadow: var(--list-shadow, 0 2px 3px 0 rgba(44, 62, 80, 0.24));
        border-radius: var(--list-border-radius, 4px);
        max-height: var(--list-max-height, 252px);
        overflow-y: auto;
        background: var(--list-background, #fff);
        position: var(--list-position, absolute);
        z-index: var(--list-z-index, 2);
        border: var(--list-border);
    }

    .value-container {
        display: flex;
        flex: 1 1 0%;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px 10px;
        padding: var(--value-container-padding, 5px 0);
        position: relative;
        overflow: var(--value-container-overflow, hidden);
        align-self: stretch;
    }

    .empty {
        text-align: var(--list-empty-text-align, center);
        padding: var(--list-empty-padding, 20px 0);
        color: var(--list-empty-color, #78848f);
    }

    .item {
        cursor: default;
        height: var(--item-height, var(--height, 42px));
        line-height: var(--item-line-height, var(--height, 42px));
        padding: var(--item-padding, 0 20px);
        color: var(--item-color, inherit);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        transition: var(--item-transition, all 0.2s);
        align-items: center;
        width: 100%;
    }

    .item:active {
        background: var(--item-active-background, #b9daff);
    }

    .item.active {
        background: var(--item-is-active-bg, #007aff);
        color: var(--item-is-active-color, #fff);
    }

    .item.first {
        border-radius: var(--item-first-border-radius, 4px 4px 0 0);
    }

    .item.hover:not(.active) {
        background: var(--item-hover-bg, #e7f2ff);
        color: var(--item-hover-color, inherit);
    }

    .item.not-selectable,
    .item.hover.item.not-selectable,
    .item.active.item.not-selectable,
    .item.not-selectable:active {
        color: var(--item-is-not-selectable-color, #999);
        background: transparent;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .clear-select {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--clear-select-width, 40px);
        height: var(--clear-select-height, 100%);
        color: var(--clear-select-color, var(--icons-color));
        margin: var(--clear-select-margin, 0);
        pointer-events: all;
        flex-shrink: 0;
    }

    .clear-select:focus {
        outline: var(--clear-select-focus-outline, 1px solid #006fe8);
    }
    
    .clear-icon {
        width: var(--clear-icon-width, 20px);
        height: var(--clear-icon-width, 20px);
        color: var(--clear-icon-color, currentColor);
    }
</style>
