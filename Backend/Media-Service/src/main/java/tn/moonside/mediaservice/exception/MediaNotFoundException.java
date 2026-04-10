package tn.moonside.mediaservice.exception;

public class MediaNotFoundException extends RuntimeException {
    public MediaNotFoundException(String message) {
        super(message);
    }
}
