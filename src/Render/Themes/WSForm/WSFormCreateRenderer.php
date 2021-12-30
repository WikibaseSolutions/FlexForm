<?php

namespace WSForm\Render\Themes\WSForm;

use WSForm\Render\CreateRenderer;
use Parser;
use PPFrame;

class WSFormCreateRenderer implements CreateRenderer {
    /**
     * @inheritDoc
     */
    public function render_create( string $input, array $args, Parser $parser, PPFrame $frame ): string {
        $template = "";
        $wswrite  = "";
        $wsoption = "";
        $wsfields = "";
        $wsfollow = "";
        $wsSlot   = "";
        $wsCreateId = '';
	    $mwleadingzero = "";

        if(isset($args['mwfields']) && $args['mwfields'] != '') {
            $div = '-^^-';
            foreach ( $args as $k => $v ) {
                if ( $k == "mwtemplate" ) {
                    $template = $v;
                }

                if( $k == 'id' ){
					$wsCreateId = $v;
				}

                if ( $k == "mwwrite" ) {
                    $wswrite = $v;
                }

				if ( $k == "mwslot" ) {
					$wsSlot = $v;
				}

                if ( $k == "mwoption" ) {
                    $wsoption = $v;
                }

                if ( $k == "mwfields" ) {
                    $wsfields = $v;
                }
	            if ( $k === "mwfollow" ) {
		            $fname = 'mwfollow';

		            if( strlen( $v ) <= 1 ) {
			            $fvalue = "true";
		            } else {
			            $fvalue = $v;
		            }
					$wsfollow = \wsform\wsform::createHiddenField( $fname, $fvalue );
	            }

            }
            if($template === '') {
                return 'No valid template for creating a page.';
            }
            if($wswrite === '') {
                return 'No valid title for creating a page.';
            }

            $createValue =
				$template . $div .
				$wswrite . $div .
				$wsoption . $div .
				$wsfields . $div .
				$wsSlot . $div .
				$wsCreateId;
	        $def = \wsform\wsform::createHiddenField( 'mwcreatemultiple[]', $createValue );

            return $def.$wsfollow ;
        } else {

            foreach ( $args as $k => $v ) {
                if ( $k == "mwtemplate" ) {
                	$template = \wsform\wsform::createHiddenField( 'mwtemplate', $v );
                }

                if ( $k == "mwwrite" ) {
	                $wswrite = \wsform\wsform::createHiddenField( 'mwwrite', $v );
                }

                if ( $k == "mwoption" ) {
	                $wsoption = \wsform\wsform::createHiddenField( 'mwoption', $v );
                }

	            if ( $k == "mwslot" ) {
	            	//{{#set: Hello=World | Description=These properties are not visible in the content }}
		            //mds-metadataslot als test
		            $wsSlot = \wsform\wsform::createHiddenField( 'mwslot', $v );
	            }

                if ( $k === "mwfollow" ) {
                	if( strlen( $v ) <= 1 ) {
		                $wsfollow = \wsform\wsform::createHiddenField( 'mwfollow', 'true' );
	                } else {
		                $wsfollow = \wsform\wsform::createHiddenField( 'mwfollow', $v );
	                }
                }

                if ( $k == "mwleadingzero" ) {
	                $wsleadingzero = \wsform\wsform::createHiddenField( 'mwleadingzero', 'true' );
                } else $wsleadingzero = '';

                /*
                if ( $k == "mwfields" ) {
                    $wsfields = '<input type="hidden" name="mwfields" value="' . $v . '">' . "\n";
                }
                */
            }
        }


        return $template . $wswrite . $wsoption . $wsfollow. $wsleadingzero . $wsSlot;


    }

}