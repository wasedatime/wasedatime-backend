import boto3
s3 = boto3.client('s3')

def get_public_url(bucket, target_object_path):
    """
    Get S3 file's URL
    Parameters
    ----------
    bucket: string
        S3 bucket name
    target_object_path: string
        file path inside bucket

    Returns
    ----------
    url: string
        Object's url inside bucket
    """
    bucket_location = s3.get_bucket_location(Bucket=bucket)
    return "https://{1}.s3-{0}.amazonaws.com/{2}".format(
        bucket_location['LocationConstraint'],
        bucket,
        target_object_path)