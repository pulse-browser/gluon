#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

action=$1

# Make sure the user has specified the location of mozilla-central in their 
# environment. Some people (i.e. trickypr) prefer to clone it into other places 
if [ ! -f .moz-central ]
then
    echo "Please make sure you specify the location of your checkout of `mozilla-central`"
    echo "inside of the `.moz-central` file."
    exit 1
fi

mozilla_centeral_repo=$(cat .moz-central)
last_patch=`exec ls -1 ./template/patches.optional | sed 's/-.*//g' | sort -n | tail -1`
next_patch=`expr 1 + ${last_patch:=0}`
root_pwd=$PWD

if [ $action = "import" ]
then
    echo "Importing:"
    echo
    
    cd $mozilla_centeral_repo
    for file in $root_pwd/template/patches.optional/*.patch
    do
        echo "  $file..."
        # --forward is used to skip the patch if it has already been applied
        patch -p1 --forward < $file
    done

    cd $root_pwd
elif [ $action = "export" ]
then
    if [ -x "$2" ]
    then
        echo "Please provide a file name. Usage: $0 $action <filename>"
        exit 1
    fi

    echo "Exporting: ${@:2}"
    echo
    
    cd $mozilla_centeral_repo
    git add ${@:2}
    git commit
    git format-patch --start-number $next_patch -1 -o $root_pwd/template/patches.optional
    cd $root_pwd
else
    echo "Usage: $0 import|export"
    echo
    echo "  import:  Import all patches in ./template/patches.optional"
    echo "  export:  Exports a specific patch. Usage: $0 export <filename>"
fi