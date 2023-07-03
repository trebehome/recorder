#!/bin/bash

echo "Deploying to $DEPLOYMENT_NAME"

aws s3 sync public/ s3://$DEPLOYMENT_NAME --delete --acl=public-read

filelist=$(aws s3 ls s3://$DEPLOYMENT_NAME --recursive | awk '{ print $NF; }')

for file in $filelist
do
  echo "Providing public access to file $file"
  aws s3api put-object-acl --bucket $DEPLOYMENT_NAME --key $file --acl public-read
done

if [ ! -z "$CACHE_INVALIDATION_ID" ]
then
      echo "Invalidating all cache on $DEPLOYMENT_NAME"
      aws cloudfront create-invalidation --distribution-id $CACHE_INVALIDATION_ID --paths "/*"
fi
