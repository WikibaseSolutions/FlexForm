<?php

namespace WSForm\Render;

use Parser;
use PPFrame;

/**
 * Interface for rendering edit fields.
 *
 * @package WSForm\Render
 */
interface EditRenderer {
    /**
     * @brief Render edit
     *
     * @param string $input Input for the field
     * @param array $args Arguments for the field
     * @param Parser $parser MediaWiki parser
     * @param PPFrame $frame Current PPFrame
     *
     * @return string Rendered HTML
     */
    public function render_edit( string $input, array $args, Parser $parser, PPFrame $frame ): string;
}